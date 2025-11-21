import { ChevronLeft, ChevronRight, Trash2, CheckCircle2, Calendar, GripVertical, Sparkles, Sun, Moon, Sunrise, Sunset, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useActions } from '../contexts/ActionsContext';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Pomodoro } from './Pomodoro';

export function TodayViewer() {
  const { 
    getTodayActions, 
    addAction, 
    toggleAction, 
    removeAction, 
    undoRemove,
    updateActionNotes,
    reorderTodayActions,
    lastActionAdded, 
    lastActionCompleted,
    lastRemovedAction 
  } = useActions();
  
  const actions = getTodayActions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newAction, setNewAction] = useState('');
  const [direction, setDirection] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const currentAction = actions[currentIndex] || { text: 'No actions for today', goal: '', id: 0 };
  const completedCount = actions.filter(a => a.completed).length;

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: 'Good Night', icon: Moon };
    if (hour < 12) return { text: 'Good Morning', icon: Sunrise };
    if (hour < 18) return { text: 'Good Afternoon', icon: Sun };
    if (hour < 21) return { text: 'Good Evening', icon: Sunset };
    return { text: 'Good Night', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Show undo toast when action is removed
  useEffect(() => {
    if (lastRemovedAction) {
      toast.custom(
        (t) => (
          <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-xl p-4 flex items-center gap-3">
            <span className="text-[0.875rem] text-black">Action deleted</span>
            <button
              onClick={() => {
                undoRemove();
                toast.dismiss(t);
              }}
              className="px-3 py-1 bg-black text-white rounded text-[0.75rem] uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              UNDO
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    }
  }, [lastRemovedAction, undoRemove]);

  // Check for all-complete celebration
  useEffect(() => {
    if (actions.length > 0 && completedCount === actions.length && completedCount > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [completedCount, actions.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
        case 'Enter':
          if (currentAction.id !== 0) {
            e.preventDefault();
            toggleAction(currentAction.id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, actions, currentAction.id, toggleAction]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    touchStartX.current = null;
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : actions.length - 1));
  };

  const goToNext = () => {
    if (actions.length > 0 && currentAction.id !== 0) {
      toggleAction(currentAction.id);
    }
    
    setDirection(1);
    setCurrentIndex((prev) => (prev < actions.length - 1 ? prev + 1 : 0));
  };

  const handleAddAction = () => {
    if (newAction.trim()) {
      addAction(newAction, 'CUSTOM');
      setNewAction('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleRemoveAction = (id: number) => {
    if (deleteConfirm === id) {
      removeAction(id);
      setDeleteConfirm(null);
      if (currentIndex >= actions.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const toggleNotes = (id: number) => {
    if (expandedNotes === id) {
      setExpandedNotes(null);
      setNoteText('');
    } else {
      setExpandedNotes(id);
      const action = actions.find(a => a.id === id);
      setNoteText(action?.notes || '');
    }
  };

  const saveNotes = (id: number) => {
    updateActionNotes(id, noteText);
    setExpandedNotes(null);
    setNoteText('');
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Pomodoro Focus Overlay */}
      <AnimatePresence>
        {pomodoroRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="bg-black text-white px-12 py-8 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <Sparkles className="w-10 h-10" />
                <div>
                  <h2 className="text-[2rem]">All Complete!</h2>
                  <p className="text-[0.875rem] opacity-90">Outstanding work today</p>
                </div>
                <Sparkles className="w-10 h-10" />
              </div>
            </motion.div>
            {/* Confetti effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: '50%', 
                  x: '50%',
                  opacity: 1,
                  scale: 1
                }}
                animate={{ 
                  y: [0, -200, -400],
                  x: [0, (Math.random() - 0.5) * 400],
                  opacity: [1, 1, 0],
                  scale: [1, 1.5, 0.5],
                  rotate: [0, Math.random() * 360]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{ 
                  background: i % 3 === 0 ? '#000000' : i % 3 === 1 ? '#9A9A9A' : '#E0E0E0',
                  left: '50%',
                  top: '50%'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="pt-20 md:pt-12 px-6 md:px-12 pb-0">
        <div className="max-w-7xl mx-auto text-center mb-8">
          <h1 className="display">DAILY LIFE PLANNER</h1>
          <motion.div 
            className="meta mt-2 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GreetingIcon className="w-4 h-4" />
            {greeting.text}
          </motion.div>
          
          {/* Pomodoro Timer - Positioned below greeting */}
          <div className="mt-6 flex justify-center">
            <Pomodoro onRunningChange={setPomodoroRunning} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center p-6 md:p-12 pt-8">
        <div className="w-full max-w-2xl relative">
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 md:left-0 top-12 md:-translate-x-16 hover:opacity-60 transition-opacity z-10"
            aria-label="Previous action"
          >
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 md:right-0 top-12 md:translate-x-16 hover:opacity-60 transition-opacity z-10"
            aria-label="Next action"
          >
            <ChevronRight className="w-6 h-6 text-primary" />
          </button>

          {/* Current Action Focus with Slide Animation */}
          <div 
            className="text-center mb-12 px-12 md:px-0 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {actions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20"
              >
                <Calendar className="w-16 h-16 mx-auto mb-6 text-smoke opacity-50" />
                <h2 className="text-[1.5rem] mb-3 text-secondary">No actions for today</h2>
                <p className="text-secondary text-[0.875rem]">Add your first action below to get started</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentAction.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <h2 className="text-[2rem] mb-4">{currentAction.text}</h2>
                  {currentAction.goal && currentAction.goal !== 'CUSTOM' && (
                    <p className="text-secondary mb-6">
                      {currentAction.goal}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Dots Indicator */}
          {actions.length > 0 && (
            <div className="flex justify-center gap-2 mb-12">
              {actions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-black w-6'
                      : action.completed
                      ? 'bg-black opacity-50'
                      : 'bg-[var(--color-border)] hover:bg-[var(--color-grey)]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Progress - Minimal */}
          {actions.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-2">
                <span className="label text-primary">
                  {completedCount} / {actions.length}
                </span>
              </div>
              <div className="w-full h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / actions.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* All Today's Actions Checklist with Drag and Drop */}
          <div>
            <Reorder.Group
              axis="y"
              values={actions}
              onReorder={reorderTodayActions}
              className="space-y-0"
            >
              <AnimatePresence>
                {actions.map((action, index) => (
                  <Reorder.Item
                    key={action.id}
                    value={action}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`${
                      index !== actions.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 py-4">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-secondary" />
                      </div>

                      {/* Checkbox */}
                      <motion.div
                        animate={lastActionCompleted === action.id ? {
                          scale: [1, 1.3, 1],
                        } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <input
                          type="checkbox"
                          checked={action.completed}
                          onChange={() => toggleAction(action.id)}
                          className="w-4 h-4 rounded border-2 border-[var(--color-border)] accent-black cursor-pointer flex-shrink-0"
                        />
                      </motion.div>

                      {/* Action Text */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[0.9375rem] ${
                          action.completed ? 'line-through text-secondary' : 'text-primary'
                        }`}>
                          {action.text}
                        </span>
                        {/* Show saved notes preview */}
                        {action.notes && expandedNotes !== action.id && (
                          <div className="mt-1.5 text-[0.75rem] text-secondary flex items-start gap-1.5">
                            <span className="opacity-60">→</span>
                            <span className="line-clamp-1">{action.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes Button with indicator */}
                      <button
                        onClick={() => toggleNotes(action.id)}
                        className={`flex items-center gap-1 transition-all duration-200 ${
                          expandedNotes === action.id
                            ? 'text-primary'
                            : action.notes 
                            ? 'text-primary' 
                            : 'text-secondary'
                        } hover:text-primary`}
                        title={action.notes ? 'Edit notes' : 'Add notes'}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedNotes === action.id ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveAction(action.id)}
                        className={`transition-colors ${
                          deleteConfirm === action.id 
                            ? 'text-red-500 font-bold' 
                            : 'text-secondary hover:text-primary'
                        }`}
                        title={deleteConfirm === action.id ? 'Click again to confirm' : 'Delete action'}
                      >
                        {deleteConfirm === action.id ? (
                          <span className="text-[0.6875rem]">CONFIRM?</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Expandable Notes */}
                    <AnimatePresence>
                      {expandedNotes === action.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-5 pt-3 px-8">
                            <div className="bg-white border border-[var(--color-border)] rounded-lg p-4 shadow-sm">
                              <label className="block text-[0.6875rem] uppercase tracking-wider text-smoke mb-2">Notes</label>
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add notes or details about this action..."
                                className="w-full px-0 py-0 text-[0.875rem] bg-transparent outline-none resize-none text-primary placeholder:text-smoke placeholder:opacity-60"
                                rows={4}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--color-border)]">
                                <button
                                  onClick={() => {
                                    setExpandedNotes(null);
                                    setNoteText('');
                                  }}
                                  className="px-4 py-1.5 text-[0.6875rem] text-secondary hover:text-primary transition-colors uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveNotes(action.id)}
                                  className="px-4 py-1.5 bg-black text-white rounded-full text-[0.6875rem] uppercase tracking-wider hover:opacity-80 transition-opacity shadow-sm"
                                >
                                  Save Notes
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {/* Add Action Input */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add action..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAction()}
                  className="flex-1 py-2 outline-none text-[0.875rem] placeholder:text-smoke placeholder:opacity-60 bg-transparent border-b border-[var(--color-border)] focus:border-black transition-colors"
                />
                <button 
                  onClick={handleAddAction}
                  className="label text-primary hover:opacity-60 transition-opacity relative"
                >
                  ADD
                </button>
              </div>
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 flex items-center gap-2 text-primary text-[0.75rem]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Action added successfully</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
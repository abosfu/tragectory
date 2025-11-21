import { Search, Check, Trash2, Archive, ChevronDown, Calendar as CalendarIcon, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useActions } from '../contexts/ActionsContext';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from './ui/calendar';

type FilterOption = 'ALL' | 'COMPLETED' | 'NOT COMPLETED';
type ViewMode = 'LIST' | 'DATES' | 'CALENDAR';

export function ActionsArchive() {
  const { getAllActions, removeAction, undoRemove, lastRemovedAction } = useActions();
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('DATES');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const allActions = getAllActions();

  // Filter actions based on completion status
  const filteredByStatus = allActions.filter(action => {
    if (filter === 'COMPLETED') return action.completed;
    if (filter === 'NOT COMPLETED') return !action.completed;
    return true;
  });

  // Filter by search query
  const filteredActions = filteredByStatus.filter(action =>
    action.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.goal.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Sort by newest first
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getDateKey = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group actions by date
  const actionsByDate = filteredActions.reduce((acc, action) => {
    const dateKey = getDateKey(action.addedAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(action);
    return acc;
  }, {} as Record<string, typeof filteredActions>);

  const dateKeys = Object.keys(actionsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Get actions for selected calendar date
  const selectedDateActions = selectedDate 
    ? filteredActions.filter(action => {
        const actionDate = new Date(action.addedAt);
        return actionDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  // Get dates that have actions for calendar highlighting
  const datesWithActions = filteredActions.map(action => {
    const date = new Date(action.addedAt);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const handleRemoveAction = (id: number) => {
    if (deleteConfirm === id) {
      removeAction(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  useEffect(() => {
    if (lastRemovedAction) {
      toast.custom(
        (t) => (
          <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-xl p-4 flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-black" />
            <span className="text-[0.875rem] text-black">Action removed: {lastRemovedAction.text}</span>
            <button
              className="px-3 py-1 bg-black text-white rounded text-[0.75rem] uppercase tracking-wider hover:opacity-80 transition-opacity"
              onClick={() => {
                undoRemove();
                toast.dismiss(t);
              }}
            >
              UNDO
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    }
  }, [lastRemovedAction]);

  return (
    <div className="min-h-screen bg-white pt-20 md:pt-12 px-6 md:px-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-2">
          <h1 className="display">DAILY LIFE PLANNER</h1>
          <div className="meta mt-2">THE ARCHIVE</div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
          {/* Filter Options */}
          <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
            <span className="label text-black">FILTER:</span>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {(['ALL', 'COMPLETED', 'NOT COMPLETED'] as FilterOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`label transition-colors ${
                    filter === option
                      ? 'text-black border-b-2 border-black pb-0.5'
                      : 'text-smoke hover:text-black'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Count */}
          <div className="flex items-center justify-center md:justify-end gap-6 flex-wrap">
            <span className="label text-black">
              {filteredActions.length} ACTIONS
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke" />
              <input
                type="text"
                placeholder="SEARCH ACTIONS"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-[var(--color-border)] rounded placeholder:text-smoke placeholder:opacity-60 text-[0.75rem] text-black focus:outline-none focus:border-black w-56 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center justify-center gap-4 mt-8 border-t border-[var(--color-border)] pt-6">
          <span className="label text-black">VIEW:</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('DATES')}
              className={`label transition-colors flex items-center gap-2 ${
                viewMode === 'DATES'
                  ? 'text-black border-b-2 border-black pb-0.5'
                  : 'text-smoke hover:text-black'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              BY DATES
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`label transition-colors flex items-center gap-2 ${
                viewMode === 'CALENDAR'
                  ? 'text-black border-b-2 border-black pb-0.5'
                  : 'text-smoke hover:text-black'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              CALENDAR
            </button>
          </div>
        </div>
      </div>

      {/* Actions Display - Different views based on viewMode */}
      <div className="max-w-7xl mx-auto pb-12">
        {filteredActions.length === 0 ? (
          <div className="text-center py-20">
            <Archive className="w-16 h-16 mx-auto mb-6 text-smoke opacity-50" />
            <p className="text-smoke text-[1rem] mb-2">No actions found</p>
            <p className="text-smoke text-[0.75rem]">Try adjusting your filters or search query</p>
          </div>
        ) : viewMode === 'DATES' ? (
          /* Date-Grouped View */
          <div className="space-y-6">
            {dateKeys.map((dateKey) => (
              <div key={dateKey} className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                {/* Date Header - Clickable */}
                <button
                  onClick={() => toggleDateExpansion(dateKey)}
                  className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-[1.125rem] text-black">{dateKey}</h3>
                    <span className="label text-smoke">
                      {actionsByDate[dateKey].length} {actionsByDate[dateKey].length === 1 ? 'ACTION' : 'ACTIONS'}
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-smoke transition-transform duration-200 ${
                      expandedDates.has(dateKey) ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Actions under this date */}
                <AnimatePresence>
                  {expandedDates.has(dateKey) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-[var(--color-border)]"
                    >
                      <div className="divide-y divide-[var(--color-border)]">
                        {actionsByDate[dateKey].map((action) => (
                          <div key={action.id} className="p-5 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-4">
                              {/* Completion Status Icon */}
                              <div 
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  action.completed 
                                    ? 'bg-black' 
                                    : 'border-2 border-[var(--color-border)]'
                                }`}
                              >
                                {action.completed && <Check className="w-4 h-4 text-white" />}
                              </div>

                              {/* Action Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[0.9375rem] mb-2 ${
                                  action.completed ? 'line-through text-smoke' : 'text-black'
                                }`}>
                                  {action.text}
                                </p>
                                
                                <div className="flex items-center gap-4 flex-wrap">
                                  {action.goal !== 'CUSTOM' && (
                                    <span className="label text-black">{action.goal}</span>
                                  )}
                                  <span className="text-[0.6875rem] text-smoke">
                                    {formatTime(action.addedAt)}
                                  </span>
                                  {action.completed && action.completedAt && (
                                    <span className="text-[0.6875rem] text-smoke">
                                      ✓ Completed {formatTime(action.completedAt)}
                                    </span>
                                  )}
                                </div>

                                {/* Saved Notes Preview */}
                                {action.notes && expandedNotes !== action.id && (
                                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                    <div className="flex items-start gap-1.5 text-[0.75rem] text-secondary">
                                      <span className="opacity-60">→</span>
                                      <span className="line-clamp-2">{action.notes}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Notes Expand Button */}
                              {action.notes && (
                                <button
                                  onClick={() => setExpandedNotes(expandedNotes === action.id ? null : action.id)}
                                  className={`transition-all duration-200 ${
                                    expandedNotes === action.id
                                      ? 'text-primary'
                                      : 'text-secondary hover:text-primary'
                                  }`}
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedNotes === action.id ? 'rotate-180' : ''}`} />
                                </button>
                              )}

                              {/* Remove Action Button */}
                              <button
                                onClick={() => handleRemoveAction(action.id)}
                                className={`transition-colors ${
                                  deleteConfirm === action.id 
                                    ? 'text-red-500' 
                                    : 'text-smoke hover:text-black'
                                }`}
                              >
                                {deleteConfirm === action.id ? (
                                  <span className="text-[0.6875rem] font-bold">CONFIRM?</span>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {/* Expandable Full Notes */}
                            <AnimatePresence>
                              {expandedNotes === action.id && action.notes && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                    <div className="bg-[#FAFAFA] border border-[var(--color-border)] rounded-lg p-4">
                                      <label className="block text-[0.6875rem] uppercase tracking-wider text-smoke mb-2">Full Notes</label>
                                      <p className="text-[0.875rem] text-primary whitespace-pre-wrap">
                                        {action.notes}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          /* Calendar View */
          <div className="grid md:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="border border-[var(--color-border)] rounded-lg p-4"
                modifiers={{
                  hasActions: datesWithActions
                }}
                modifiersClassNames={{
                  hasActions: 'bg-black text-white hover:bg-black hover:text-white rounded-full'
                }}
              />
            </div>

            {/* Selected Date Actions */}
            <div>
              {selectedDate ? (
                <div>
                  <h3 className="text-[1.125rem] mb-4 text-black">
                    {getDateKey(selectedDate)}
                  </h3>
                  {selectedDateActions.length === 0 ? (
                    <div className="text-center py-12 border border-[var(--color-border)] rounded-lg">
                      <p className="text-smoke text-[0.875rem]">No actions on this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateActions.map((action) => (
                        <div
                          key={action.id}
                          className="bg-white border border-[var(--color-border)] rounded-lg p-4 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                action.completed 
                                  ? 'bg-black' 
                                  : 'border-2 border-[var(--color-border)]'
                              }`}
                            >
                              {action.completed && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-[0.875rem] mb-1 ${
                                action.completed ? 'line-through text-smoke' : 'text-black'
                              }`}>
                                {action.text}
                              </p>
                              
                              <div className="flex items-center gap-3 flex-wrap text-[0.625rem]">
                                {action.goal !== 'CUSTOM' && (
                                  <span className="label text-black">{action.goal}</span>
                                )}
                                <span className="text-smoke">{formatTime(action.addedAt)}</span>
                              </div>

                              {action.notes && (
                                <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                                  <p className="text-[0.75rem] text-secondary line-clamp-2">{action.notes}</p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleRemoveAction(action.id)}
                              className={`transition-colors ${
                                deleteConfirm === action.id 
                                  ? 'text-red-500' 
                                  : 'text-smoke hover:text-black'
                              }`}
                            >
                              {deleteConfirm === action.id ? (
                                <span className="text-[0.625rem] font-bold">CONFIRM?</span>
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-[var(--color-border)] rounded-lg">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-smoke opacity-50" />
                  <p className="text-smoke text-[0.875rem]">Select a date to view actions</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
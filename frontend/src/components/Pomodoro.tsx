import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroProps {
  onComplete?: () => void;
  onRunningChange?: (isRunning: boolean) => void;
}

export function Pomodoro({ onComplete, onRunningChange }: PomodoroProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  useEffect(() => {
    if (onRunningChange) {
      onRunningChange(isRunning);
    }
  }, [isRunning, onRunningChange]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // Every 4 work sessions, take a long break
      if (newSessionsCompleted % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
      
      if (onComplete) onComplete();
    } else {
      setMode('work');
      setTimeLeft(WORK_TIME);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(WORK_TIME);
    setSessionsCompleted(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'work':
        return 'FOCUS';
      case 'shortBreak':
        return 'SHORT BREAK';
      case 'longBreak':
        return 'LONG BREAK';
    }
  };

  const getProgress = () => {
    const total = mode === 'work' ? WORK_TIME : mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="relative">
      {/* Minimalist Icon Only */}
      <div
        onMouseEnter={() => {
          hoverTimeoutRef.current = setTimeout(() => setIsHovered(true), 300);
        }}
        onMouseLeave={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(false);
        }}
        className="cursor-pointer"
      >
        <div className={`flex items-center gap-2 transition-all duration-200 ${
          isHovered || isRunning ? 'text-primary' : 'text-secondary hover:text-primary'
        }`}>
          <Timer className="w-5 h-5" />
          {isRunning && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-black rounded-full"
            />
          )}
        </div>
      </div>

      {/* Expandable Pomodoro Interface */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => setIsHovered(false), 300);
            }}
            className="absolute left-0 top-full mt-2 bg-white border border-[var(--color-border)] rounded-lg shadow-xl z-50 w-72 p-6"
          >
            {/* Mode Label */}
            <div className="text-center mb-4">
              <div className="label text-black mb-1">{getModeLabel()}</div>
              <div className="text-[0.6875rem] text-secondary">
                Session {sessionsCompleted + 1} {mode === 'work' && `of 4`}
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-6">
              <div className="text-[3rem] tracking-tight mb-2" style={{ fontVariant: 'tabular-nums' }}>
                {formatTime(timeLeft)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: `${getProgress()}%` }}
                  animate={{ width: `${getProgress()}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className="px-6 py-2.5 bg-black text-white rounded flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="label">PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="label">START</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="p-2.5 border border-[var(--color-border)] rounded hover:border-black transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Sessions Indicator */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4].map((session) => (
                  <div
                    key={session}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      session <= sessionsCompleted % 4 || (sessionsCompleted % 4 === 0 && sessionsCompleted > 0)
                        ? 'bg-black'
                        : 'bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center text-[0.6875rem] text-secondary mt-2">
                {Math.floor(sessionsCompleted / 4)} cycles completed
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
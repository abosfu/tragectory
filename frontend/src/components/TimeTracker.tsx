import { Clock, X, Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner@2.0.3';

type Mode = 'timer' | 'stopwatch' | 'pomodoro' | null;
type PomodoroPhase = 'work' | 'break';

export function TimeTracker() {
  const [showMenu, setShowMenu] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [inputMinutes, setInputMinutes] = useState('25');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pomodoro state
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [workDuration] = useState(25 * 60);
  const [breakDuration] = useState(5 * 60);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (mode === 'timer' || mode === 'pomodoro') {
            if (prev <= 0) {
              if (mode === 'pomodoro') {
                handlePomodoroComplete();
              } else {
                setIsRunning(false);
                toast.success('Timer complete!');
              }
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
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
  }, [isRunning, mode]);

  const handlePomodoroComplete = () => {
    if (pomodoroPhase === 'work') {
      setPomodoroPhase('break');
      setSeconds(breakDuration);
      setPomodoroCount(prev => prev + 1);
      toast.success('Work session complete! Time for a break.');
    } else {
      setPomodoroPhase('work');
      setSeconds(workDuration);
      toast.success('Break complete! Ready for the next session.');
    }
  };

  const startTimer = () => {
    setMode('timer');
    setSeconds(timerDuration);
    setIsRunning(true);
    setShowMenu(false);
  };

  const startStopwatch = () => {
    setMode('stopwatch');
    setSeconds(0);
    setIsRunning(true);
    setShowMenu(false);
  };

  const startPomodoro = () => {
    setMode('pomodoro');
    setPomodoroPhase('work');
    setPomodoroCount(0);
    setSeconds(workDuration);
    setIsRunning(true);
    setShowMenu(false);
  };

  const togglePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    if (mode === 'timer') {
      setSeconds(timerDuration);
    } else if (mode === 'pomodoro') {
      setPomodoroPhase('work');
      setSeconds(workDuration);
    } else {
      setSeconds(0);
    }
  };

  const close = () => {
    setMode(null);
    setIsRunning(false);
    setSeconds(0);
    setPomodoroPhase('work');
    setPomodoroCount(0);
  };

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (mode === 'timer') {
      return (seconds / timerDuration) * 100;
    } else if (mode === 'pomodoro') {
      const totalDuration = pomodoroPhase === 'work' ? workDuration : breakDuration;
      return (seconds / totalDuration) * 100;
    }
    return 0;
  };

  const circumference = 2 * Math.PI * 120;

  const updateTimerDuration = () => {
    const mins = parseInt(inputMinutes) || 25;
    setTimerDuration(mins * 60);
  };

  return (
    <>
      {/* Clock Icon - Clickable */}
      <div className="relative inline-block">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="relative transition-transform duration-300 ease-out hover:scale-110 p-2"
        >
          <Clock className="w-5 h-5 text-primary hover:text-accent transition-colors" />
        </button>

        {/* Popup Menu */}
        {showMenu && !mode && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-[60]" 
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-[var(--color-border)] rounded-3xl overflow-hidden z-[70] shadow-2xl w-[220px]">
              <div className="p-6 flex flex-col gap-3">
                {/* Pomodoro Button */}
                <button
                  onClick={startPomodoro}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-[var(--color-accent)] to-[#B89968] text-white rounded-full hover:opacity-90 transition-all text-[0.75rem] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Coffee className="w-4 h-4" />
                  POMODORO
                </button>

                {/* Timer Input Section */}
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={inputMinutes}
                      onChange={(e) => setInputMinutes(e.target.value)}
                      onBlur={updateTimerDuration}
                      className="w-14 px-2 py-1 text-center text-[0.875rem] border border-[var(--color-border)] rounded bg-white outline-none focus:border-[var(--color-accent)] transition-colors"
                    />
                    <span className="text-[0.75rem] text-secondary uppercase tracking-wide">min</span>
                  </div>
                  <button
                    onClick={startTimer}
                    className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-full hover:opacity-90 transition-all text-[0.75rem] uppercase tracking-wider"
                  >
                    TIMER
                  </button>
                </div>

                {/* Divider */}
                <div className="w-16 h-px bg-[var(--color-border)] mx-auto"></div>

                {/* Stopwatch Button */}
                <button
                  onClick={startStopwatch}
                  className="w-full px-6 py-2 border-2 border-[var(--color-accent)] text-[var(--color-accent)] rounded-full hover:bg-[var(--color-accent)] hover:text-white transition-all text-[0.75rem] uppercase tracking-wider"
                >
                  STOPWATCH
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Timer/Stopwatch/Pomodoro Display */}
      {mode && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div className="relative bg-white rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 hover:opacity-60 transition-opacity"
            >
              <X className="w-5 h-5 text-primary" />
            </button>

            {/* Mode Label */}
            <div className="text-center mb-6">
              <span className="label text-accent">
                {mode === 'timer' && 'TIMER'}
                {mode === 'stopwatch' && 'STOPWATCH'}
                {mode === 'pomodoro' && (
                  <div className="flex items-center justify-center gap-2">
                    <Coffee className="w-4 h-4" />
                    POMODORO {pomodoroPhase === 'work' ? 'WORK' : 'BREAK'}
                  </div>
                )}
              </span>
              {mode === 'pomodoro' && (
                <div className="text-[0.6875rem] text-secondary mt-1">
                  Session {pomodoroCount + 1}
                </div>
              )}
            </div>

            {/* Circular Clock */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Background Circle */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="var(--color-border)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Circle for Timer & Pomodoro */}
                {(mode === 'timer' || mode === 'pomodoro') && (
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke={mode === 'pomodoro' && pomodoroPhase === 'break' ? '#8BC34A' : 'var(--color-accent)'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (getProgress() / 100) * circumference}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                )}
                {/* Animated Circle for Stopwatch */}
                {mode === 'stopwatch' && isRunning && (
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="var(--color-accent)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="20 10"
                    className="animate-spin"
                    style={{ animationDuration: '4s' }}
                  />
                )}
              </svg>

              {/* Time Display */}
              <div className="text-center z-10">
                <div className="text-[3rem] tracking-tight tabular-nums">
                  {formatTime(seconds)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-[var(--color-accent)] hover:opacity-80 transition-opacity flex items-center justify-center group"
              >
                {isRunning ? (
                  <Pause className="w-6 h-6 text-white" fill="white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                )}
              </button>
              
              <button
                onClick={reset}
                className="w-14 h-14 rounded-full border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

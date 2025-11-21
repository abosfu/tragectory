import { X } from 'lucide-react';

interface GoalCardProps {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  steps: { total: number; completed: number };
  daysActive: number;
  completion: number;
  imageGradient: string;
  onRemove?: () => void;
}

export function GoalCard({
  id,
  title,
  category,
  timestamp,
  steps,
  daysActive,
  completion,
  imageGradient,
  onRemove
}: GoalCardProps) {
  // Determine status based on completion
  const getStatus = () => {
    if (completion === 100) return { label: 'COMPLETED', color: 'text-[var(--color-accent)]' };
    if (completion > 0) return { label: 'IN PROGRESS', color: 'text-secondary' };
    return { label: 'NOT STARTED', color: 'text-secondary' };
  };

  const status = getStatus();
  const date = timestamp.split('·')[1]?.trim() || 'Nov 20, 2025';
  const time = timestamp.split('·')[0]?.trim() || '6:08 PM';

  return (
    <div className="group relative bg-white rounded-lg border border-[var(--color-border)] p-4 transition-all hover:border-[var(--color-accent)] hover:shadow-sm cursor-pointer">
      {/* Header Row - Date and Remove */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.75rem] text-secondary">{date}</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--color-bg)] rounded"
        >
          <X className="w-3.5 h-3.5 text-secondary" />
        </button>
      </div>

      {/* Goal Visual */}
      <div 
        className="w-full h-32 rounded mb-3 flex items-center justify-center"
        style={{ background: imageGradient }}
      >
        <span className="code text-white/80">{id}</span>
      </div>

      {/* Title */}
      <h3 className="mb-3 group-hover:text-[var(--color-accent)] transition-colors">
        {title}
      </h3>

      {/* Bottom Row - Time and Status */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
        <span className="text-[0.6875rem] text-secondary">{time}</span>
        <span className={`text-[0.6875rem] font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
import { Search } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';

const mockGoals = [
  {
    id: 'GL-01',
    title: 'BUILD MERN PORTFOLIO',
    category: 'CAREER',
    timestamp: '6:08 PM · Nov 20, 2025',
    steps: { total: 7, completed: 3 },
    daysActive: 12,
    completion: 43,
    imageGradient: 'var(--gradient-primary)'
  },
  {
    id: 'GL-02',
    title: 'MASTER SYSTEM DESIGN',
    category: 'LEARNING',
    timestamp: '9:23 AM · Nov 19, 2025',
    steps: { total: 10, completed: 6 },
    daysActive: 28,
    completion: 60,
    imageGradient: 'var(--gradient-secondary)'
  },
  {
    id: 'GL-03',
    title: 'MORNING ROUTINE',
    category: 'HEALTH',
    timestamp: '7:15 AM · Nov 18, 2025',
    steps: { total: 5, completed: 5 },
    daysActive: 45,
    completion: 100,
    imageGradient: 'var(--gradient-tertiary)'
  },
  {
    id: 'GL-04',
    title: 'LAUNCH SIDE PROJECT',
    category: 'BUSINESS',
    timestamp: '2:47 PM · Nov 17, 2025',
    steps: { total: 12, completed: 2 },
    daysActive: 8,
    completion: 17,
    imageGradient: 'var(--gradient-primary)'
  },
  {
    id: 'GL-05',
    title: 'READ 24 BOOKS',
    category: 'GROWTH',
    timestamp: '5:32 PM · Nov 15, 2025',
    steps: { total: 24, completed: 8 },
    daysActive: 90,
    completion: 33,
    imageGradient: 'var(--gradient-secondary)'
  },
  {
    id: 'GL-06',
    title: 'LEETCODE CONSISTENCY',
    category: 'CAREER',
    timestamp: '11:12 AM · Nov 14, 2025',
    steps: { total: 100, completed: 34 },
    daysActive: 65,
    completion: 34,
    imageGradient: 'var(--gradient-tertiary)'
  },
  {
    id: 'GL-07',
    title: 'DECLUTTER SPACE',
    category: 'LIFE',
    timestamp: '8:45 PM · Nov 12, 2025',
    steps: { total: 8, completed: 7 },
    daysActive: 5,
    completion: 88,
    imageGradient: 'var(--gradient-primary)'
  },
  {
    id: 'GL-08',
    title: 'IMPROVE POSTURE',
    category: 'HEALTH',
    timestamp: '10:20 AM · Nov 10, 2025',
    steps: { total: 6, completed: 4 },
    daysActive: 21,
    completion: 67,
    imageGradient: 'var(--gradient-secondary)'
  }
];

type SortOption = 'OLDEST' | 'NEWEST' | 'FOCUS';

export function GoalsArchive() {
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-primary p-6 md:p-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-2">
          <h1 className="display">DAILY LIFE PLANNER</h1>
          <div className="meta mt-2">THE ARCHIVE</div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <span className="label">SORT BY:</span>
            <div className="flex items-center gap-3">
              {(['OLDEST', 'NEWEST', 'FOCUS'] as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`label transition-colors ${
                    sortBy === option
                      ? 'text-accent border-b-2 border-accent pb-0.5'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Count */}
          <div className="flex items-center gap-6">
            <span className="label">{mockGoals.length} GOALS</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
              <input
                type="text"
                placeholder="SEARCH GOAL"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-[var(--color-border)] rounded placeholder:text-secondary placeholder:text-[0.6875rem] text-[0.75rem] focus:outline-none focus:border-[var(--color-accent)] w-48 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockGoals.map((goal) => (
            <GoalCard key={goal.id} {...goal} />
          ))}
        </div>
      </div>
    </div>
  );
}
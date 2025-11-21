import { useState } from 'react';
import { ActionsArchive } from './components/ActionsArchive';
import { TodayViewer } from './components/TodayViewer';
import { Grid3x3, Calendar } from 'lucide-react';
import { ActionsProvider } from './contexts/ActionsContext';
import { Toaster } from 'sonner@2.0.3';

type View = 'archive' | 'today';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('today');

  return (
    <ActionsProvider>
      <div className="min-h-screen bg-white">
        {/* Toast Notifications */}
        <Toaster position="bottom-center" />

        {/* Navigation */}
        <div className="fixed top-6 right-4 md:right-6 z-50 flex items-center bg-white rounded-full shadow-lg overflow-hidden border border-[var(--color-border)]">
          <button
            onClick={() => setCurrentView('today')}
            className={`px-4 py-2.5 flex items-center gap-2 transition-all ${
              currentView === 'today'
                ? 'bg-black text-white'
                : 'bg-white text-secondary hover:text-black'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="label">TODAY</span>
          </button>
          <button
            onClick={() => setCurrentView('archive')}
            className={`px-4 py-2.5 flex items-center gap-2 transition-all border-l border-[var(--color-border)] ${
              currentView === 'archive'
                ? 'bg-black text-white'
                : 'bg-white text-secondary hover:text-black'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="label">ARCHIVE</span>
          </button>
        </div>

        {/* Render Current View */}
        {currentView === 'archive' ? <ActionsArchive /> : <TodayViewer />}
      </div>
    </ActionsProvider>
  );
}
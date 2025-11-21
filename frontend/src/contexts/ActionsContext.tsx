import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Action {
  id: number;
  text: string;
  goal: string;
  goalId: string;
  completed: boolean;
  addedAt: Date;
  completedAt?: Date;
  notes?: string;
  order?: number;
}

interface ActionsContextType {
  actions: Action[];
  addAction: (text: string, goal?: string) => void;
  toggleAction: (id: number) => void;
  removeAction: (id: number) => void;
  undoRemove: () => void;
  updateActionNotes: (id: number, notes: string) => void;
  reorderTodayActions: (reorderedActions: Action[]) => void;
  getTodayActions: () => Action[];
  getAllActions: () => Action[];
  lastActionAdded: number | null;
  lastActionCompleted: number | null;
  lastRemovedAction: Action | null;
}

const ActionsContext = createContext<ActionsContextType | undefined>(undefined);

const initialActions: Action[] = [
  { id: 1, text: 'Code 1 hour on portfolio frontend', goal: 'BUILD MERN PORTFOLIO', goalId: 'GL-01', completed: false, addedAt: new Date('2024-11-21T09:30:00'), order: 0 },
  { id: 2, text: 'Review MongoDB models and schema design', goal: 'BUILD MERN PORTFOLIO', goalId: 'GL-01', completed: false, addedAt: new Date('2024-11-21T09:35:00'), order: 1 },
  { id: 3, text: 'Read Chapter 7 of DDIA book', goal: 'MASTER SYSTEM DESIGN', goalId: 'GL-02', completed: false, addedAt: new Date('2024-11-21T10:00:00'), order: 2 },
  { id: 4, text: 'Practice designing a chat system', goal: 'MASTER SYSTEM DESIGN', goalId: 'GL-02', completed: false, addedAt: new Date('2024-11-21T10:15:00'), order: 3 },
  { id: 5, text: 'Wake up at 6:00 AM', goal: 'MORNING ROUTINE', goalId: 'GL-03', completed: true, addedAt: new Date('2024-11-21T06:00:00'), completedAt: new Date('2024-11-21T06:05:00'), order: 4 },
  { id: 6, text: '10 minutes stretching routine', goal: 'MORNING ROUTINE', goalId: 'GL-03', completed: true, addedAt: new Date('2024-11-21T06:10:00'), completedAt: new Date('2024-11-21T06:20:00'), order: 5 },
  { id: 7, text: 'Test API endpoints with Postman', goal: 'BUILD MERN PORTFOLIO', goalId: 'GL-01', completed: false, addedAt: new Date('2024-11-21T11:00:00'), order: 6 },
  { id: 8, text: 'Review caching strategies notes', goal: 'MASTER SYSTEM DESIGN', goalId: 'GL-02', completed: false, addedAt: new Date('2024-11-21T11:30:00'), order: 7 },
  // Some older actions for archive
  { id: 9, text: 'Complete React hooks tutorial', goal: 'BUILD MERN PORTFOLIO', goalId: 'GL-01', completed: true, addedAt: new Date('2024-11-20T14:20:00'), completedAt: new Date('2024-11-20T16:45:00') },
  { id: 10, text: 'Study load balancing concepts', goal: 'MASTER SYSTEM DESIGN', goalId: 'GL-02', completed: true, addedAt: new Date('2024-11-20T09:15:00'), completedAt: new Date('2024-11-20T10:30:00') },
  { id: 11, text: 'Morning meditation 15 min', goal: 'MORNING ROUTINE', goalId: 'GL-03', completed: true, addedAt: new Date('2024-11-20T06:30:00'), completedAt: new Date('2024-11-20T06:45:00') },
  { id: 12, text: 'Write API documentation', goal: 'BUILD MERN PORTFOLIO', goalId: 'GL-01', completed: false, addedAt: new Date('2024-11-19T13:00:00') },
  { id: 13, text: 'Research microservices patterns', goal: 'MASTER SYSTEM DESIGN', goalId: 'GL-02', completed: true, addedAt: new Date('2024-11-19T10:00:00'), completedAt: new Date('2024-11-19T11:30:00') },
];

// Load from localStorage or use initial data
const loadActions = (): Action[] => {
  if (typeof window === 'undefined') return initialActions;
  
  const saved = localStorage.getItem('dailyLifePlannerActions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((action: any) => ({
        ...action,
        addedAt: new Date(action.addedAt),
        completedAt: action.completedAt ? new Date(action.completedAt) : undefined,
      }));
    } catch (e) {
      return initialActions;
    }
  }
  return initialActions;
};

export function ActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<Action[]>(loadActions);
  const [lastActionAdded, setLastActionAdded] = useState<number | null>(null);
  const [lastActionCompleted, setLastActionCompleted] = useState<number | null>(null);
  const [lastRemovedAction, setLastRemovedAction] = useState<Action | null>(null);

  // Save to localStorage whenever actions change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dailyLifePlannerActions', JSON.stringify(actions));
    }
  }, [actions]);

  const addAction = (text: string, goal: string = 'CUSTOM') => {
    const todayActions = getTodayActions();
    const maxOrder = todayActions.length > 0 ? Math.max(...todayActions.map(a => a.order || 0)) : -1;
    
    const newAction: Action = {
      id: Math.max(...actions.map(a => a.id), 0) + 1,
      text,
      goal,
      goalId: 'GL-XX',
      completed: false,
      addedAt: new Date(),
      order: maxOrder + 1,
    };
    setActions([...actions, newAction]);
    setLastActionAdded(newAction.id);
    setTimeout(() => setLastActionAdded(null), 1000);
  };

  const toggleAction = (id: number) => {
    setActions(actions.map(action => {
      if (action.id === id) {
        const newCompleted = !action.completed;
        if (newCompleted) {
          setLastActionCompleted(id);
          setTimeout(() => setLastActionCompleted(null), 600);
        }
        return {
          ...action,
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : undefined,
        };
      }
      return action;
    }));
  };

  const removeAction = (id: number) => {
    const actionToRemove = actions.find(a => a.id === id);
    if (actionToRemove) {
      setLastRemovedAction(actionToRemove);
      setActions(actions.filter(action => action.id !== id));
    }
  };

  const undoRemove = () => {
    if (lastRemovedAction) {
      setActions([...actions, lastRemovedAction]);
      setLastRemovedAction(null);
    }
  };

  const updateActionNotes = (id: number, notes: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, notes } : action
    ));
  };

  const reorderTodayActions = (reorderedActions: Action[]) => {
    // Update the order property for reordered actions
    const reorderedWithOrder = reorderedActions.map((action, index) => ({
      ...action,
      order: index
    }));

    // Replace today's actions with reordered ones, keep other actions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const otherActions = actions.filter(action => {
      const actionDate = new Date(action.addedAt);
      actionDate.setHours(0, 0, 0, 0);
      return actionDate.getTime() !== today.getTime();
    });

    setActions([...otherActions, ...reorderedWithOrder]);
  };

  const getTodayActions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return actions.filter(action => {
      const actionDate = new Date(action.addedAt);
      actionDate.setHours(0, 0, 0, 0);
      return actionDate.getTime() === today.getTime();
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getAllActions = () => {
    return actions;
  };

  return (
    <ActionsContext.Provider value={{ 
      actions, 
      addAction, 
      toggleAction, 
      removeAction,
      undoRemove,
      updateActionNotes,
      reorderTodayActions,
      getTodayActions, 
      getAllActions,
      lastActionAdded,
      lastActionCompleted,
      lastRemovedAction
    }}>
      {children}
    </ActionsContext.Provider>
  );
}

export function useActions() {
  const context = useContext(ActionsContext);
  if (context === undefined) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
}
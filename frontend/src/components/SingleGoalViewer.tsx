import { ChevronLeft, ChevronRight, Plus, ArrowLeft, User, X } from 'lucide-react';
import { useState } from 'react';

const mockGoals = [
  {
    id: 'GL-01',
    title: 'BUILD MERN PORTFOLIO',
    description: 'Create a full-stack portfolio showcasing React, Node.js, and MongoDB projects',
    category: 'CAREER',
    status: 'ACTIVE',
    steps: { total: 7, completed: 3 },
    stepsDetail: [
      { id: 1, text: 'Set up project repository and initial structure', completed: true, tag: 'SETUP' },
      { id: 2, text: 'Design UI/UX mockups in Figma', completed: true, tag: 'DESIGN' },
      { id: 3, text: 'Build React frontend with routing', completed: true, tag: 'FRONTEND' },
      { id: 4, text: 'Create Node.js backend API', completed: false, tag: 'BACKEND' },
      { id: 5, text: 'Set up MongoDB database and schemas', completed: false, tag: 'DATABASE' },
      { id: 6, text: 'Deploy to production', completed: false, tag: 'DEPLOY' },
      { id: 7, text: 'Add contact form and analytics', completed: false, tag: 'FEATURES' }
    ],
    imageGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'GL-02',
    title: 'MASTER SYSTEM DESIGN',
    description: 'Study distributed systems, scalability patterns, and architecture principles',
    category: 'LEARNING',
    status: 'ACTIVE',
    steps: { total: 10, completed: 6 },
    stepsDetail: [
      { id: 1, text: 'Complete Designing Data-Intensive Applications', completed: true, tag: 'READING' },
      { id: 2, text: 'Study CAP theorem and consistency models', completed: true, tag: 'THEORY' },
      { id: 3, text: 'Learn about load balancing strategies', completed: true, tag: 'THEORY' },
      { id: 4, text: 'Design Twitter-like system', completed: true, tag: 'PRACTICE' },
      { id: 5, text: 'Design URL shortener service', completed: true, tag: 'PRACTICE' },
      { id: 6, text: 'Study database sharding techniques', completed: true, tag: 'DATABASE' },
      { id: 7, text: 'Design chat application architecture', completed: false, tag: 'PRACTICE' },
      { id: 8, text: 'Learn about caching strategies (Redis)', completed: false, tag: 'THEORY' },
      { id: 9, text: 'Study message queues and event streaming', completed: false, tag: 'THEORY' },
      { id: 10, text: 'Design Netflix-like streaming service', completed: false, tag: 'PRACTICE' }
    ],
    imageGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'GL-03',
    title: 'MORNING ROUTINE',
    description: 'Establish a consistent morning routine for better productivity and health',
    category: 'HEALTH',
    status: 'ACTIVE',
    steps: { total: 5, completed: 5 },
    stepsDetail: [
      { id: 1, text: 'Wake up at 6:00 AM consistently', completed: true, tag: 'HABIT' },
      { id: 2, text: '10 minutes of stretching', completed: true, tag: 'EXERCISE' },
      { id: 3, text: 'Drink 500ml water', completed: true, tag: 'HEALTH' },
      { id: 4, text: 'Journal for 5 minutes', completed: true, tag: 'MINDFULNESS' },
      { id: 5, text: 'Review daily goals', completed: true, tag: 'PLANNING' }
    ],
    imageGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
];

export function SingleGoalViewer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [newStep, setNewStep] = useState('');

  const currentGoal = mockGoals[currentIndex];
  const progressPercentage = (currentGoal.steps.completed / currentGoal.steps.total) * 100;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mockGoals.length - 1));
    setShowDetails(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < mockGoals.length - 1 ? prev + 1 : 0));
    setShowDetails(false);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button className="p-2 hover:bg-[var(--color-bg)] rounded transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="display text-[1.125rem]">MINI LIFE PLANNER</h1>
          <button className="p-2 hover:bg-[var(--color-bg)] rounded transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-2xl relative">
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 p-2 hover:bg-white rounded-full transition-all border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 p-2 hover:bg-white rounded-full transition-all border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Goal Card */}
          <div className="bg-white rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden">
            {/* Goal Visual */}
            <div 
              className="w-full h-64 md:h-80 flex items-center justify-center"
              style={{ background: currentGoal.imageGradient }}
            >
              <div className="text-center text-white">
                <div className="code mb-2 text-white/80">{currentGoal.id}</div>
                <h2 className="text-white mb-2">{currentGoal.title}</h2>
                <p className="text-[0.875rem] text-white/90 max-w-md mx-auto px-4">
                  {currentGoal.description}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 py-6 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="label">PROGRESS</span>
                <span className="label text-accent">
                  {currentGoal.steps.completed} / {currentGoal.steps.total} STEPS DONE
                </span>
              </div>
              <div className="w-full h-1 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {mockGoals.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowDetails(false);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-[var(--color-accent)] w-6'
                    : 'bg-[var(--color-border)] hover:bg-[var(--color-text-secondary)]'
                }`}
              />
            ))}
          </div>

          {/* Meta Info */}
          <div className="text-center mt-6 space-y-1">
            <div className="code">{currentGoal.id}</div>
            <div className="text-[0.9375rem]">{currentGoal.title}</div>
            <div className="meta">
              FOCUS: {currentGoal.category} · {currentGoal.status}
            </div>
          </div>

          {/* Toggle Details Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-3 hover:bg-white rounded-full transition-all border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-white rotate-0 hover:rotate-90"
              style={{ transition: 'all 0.3s ease' }}
            >
              {showDetails ? (
                <X className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Details Overlay */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/20 flex items-end md:items-center justify-center z-50 p-0 md:p-6"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="bg-white w-full md:max-w-2xl md:rounded-lg shadow-xl max-h-[85vh] overflow-hidden flex flex-col rounded-t-2xl md:rounded-t-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="heading">STEPS FOR {currentGoal.id}</h3>
                <div className="meta mt-1">
                  {currentGoal.steps.completed} OF {currentGoal.steps.total} COMPLETED
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-[var(--color-bg)] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {currentGoal.stepsDetail.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 p-3 rounded hover:bg-[var(--color-bg)] transition-colors"
                  >
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={step.completed}
                        readOnly
                        className="w-4 h-4 rounded border-2 border-[var(--color-border)] accent-[var(--color-accent)] cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[0.875rem] ${step.completed ? 'line-through text-secondary' : ''}`}>
                        {step.text}
                      </p>
                    </div>
                    <span className="code text-[0.625rem] bg-[var(--color-bg)] px-2 py-1 rounded">
                      {step.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Step Input */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="ADD A NEW STEP..."
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border-b-2 border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors text-[0.875rem] placeholder:text-secondary rounded-t"
                />
                <button className="label text-accent hover:text-primary transition-colors px-4 py-2.5">
                  ADD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

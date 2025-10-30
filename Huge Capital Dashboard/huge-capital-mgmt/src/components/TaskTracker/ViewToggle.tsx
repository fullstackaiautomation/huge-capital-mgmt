import { List, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';

export type ViewMode = 'list' | 'board' | 'calendar';

type ViewToggleProps = {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
};

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  const views = [
    { id: 'list' as ViewMode, icon: List, label: 'List' },
    { id: 'board' as ViewMode, icon: LayoutGrid, label: 'Board' },
    { id: 'calendar' as ViewMode, icon: CalendarIcon, label: 'Calendar' },
  ];

  return (
    <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1.5 border border-gray-700/50">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-md transition-all text-base font-bold ${
              currentView === view.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

import { X, Filter, Search, User } from 'lucide-react';
import { useState, useMemo } from 'react';

type Task = {
  id: string;
  taskName: string;
  description: string;
  assignee: 'Zac' | 'Luke' | 'Dillon' | '';
  area: 'Tactstack' | 'Full Stack' | 'Admin' | 'Marketing' | 'Deals' | '';
  dueDate: string;
  completed: boolean;
  completed_date?: string;
};

type FilterBarProps = {
  selectedAssignees: string[];
  selectedAreas: string[];
  searchQuery: string;
  tasks: Task[];
  onAssigneesChange: (assignees: string[]) => void;
  onAreasChange: (areas: string[]) => void;
  onSearchChange: (query: string) => void;
  compact?: boolean;
};

const ASSIGNEES = ['Zac', 'Luke', 'Dillon'];
const AREAS = ['Tactstack', 'Full Stack', 'Admin', 'Marketing', 'Deals'];

export const FilterBar = ({
  selectedAssignees,
  selectedAreas,
  searchQuery,
  tasks,
  onAssigneesChange,
  onAreasChange,
  onSearchChange,
  compact = false,
}: FilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  // Calculate workload by assignee
  const workloadByAssignee = useMemo(() => {
    return tasks
      .filter(t => !t.completed && t.assignee)
      .reduce((acc, task) => {
        const assignee = task.assignee;
        if (assignee) {
          acc[assignee] = (acc[assignee] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
  }, [tasks]);

  // Calculate total tasks (including unassigned)
  const totalAllTasks = useMemo(() => {
    return tasks.filter(t => !t.completed).length;
  }, [tasks]);

  const setAllTasks = () => {
    // Always clear the filter to show all tasks
    onAssigneesChange([]);
  };

  const toggleAssignee = (assignee: string) => {
    if (selectedAssignees.includes(assignee)) {
      onAssigneesChange(selectedAssignees.filter(a => a !== assignee));
    } else {
      onAssigneesChange([...selectedAssignees, assignee]);
    }
  };

  const setOnlyAssignee = (assignee: string) => {
    // If this assignee is the only one selected, clear the filter
    if (selectedAssignees.length === 1 && selectedAssignees[0] === assignee) {
      onAssigneesChange([]);
    } else {
      // Otherwise, set only this assignee
      onAssigneesChange([assignee]);
    }
  };

  const toggleArea = (area: string) => {
    if (selectedAreas.includes(area)) {
      onAreasChange(selectedAreas.filter(a => a !== area));
    } else {
      onAreasChange([...selectedAreas, area]);
    }
  };

  const clearAllFilters = () => {
    onAssigneesChange([]);
    onAreasChange([]);
    onSearchChange('');
  };

  const activeFilterCount = selectedAssignees.length + selectedAreas.length + (searchQuery ? 1 : 0);

  const getAssigneeColorStates = (assignee: string) => {
    const colorMap: { [key: string]: { active: string; selected: string; inactive: string; badgeActive: string; badgeInactive: string } } = {
      'Zac': {
        active: 'bg-blue-600 border-blue-500 text-white',
        selected: 'bg-blue-600/70 border-blue-500/70 text-blue-100',
        inactive: 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300',
        badgeActive: 'bg-blue-700 text-blue-100',
        badgeInactive: 'bg-gray-700/50 text-gray-500',
      },
      'Luke': {
        active: 'bg-green-600 border-green-500 text-white',
        selected: 'bg-green-600/70 border-green-500/70 text-green-100',
        inactive: 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300',
        badgeActive: 'bg-green-700 text-green-100',
        badgeInactive: 'bg-gray-700/50 text-gray-500',
      },
      'Dillon': {
        active: 'bg-orange-600 border-orange-500 text-white',
        selected: 'bg-orange-600/70 border-orange-500/70 text-orange-100',
        inactive: 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300',
        badgeActive: 'bg-orange-700 text-orange-100',
        badgeInactive: 'bg-gray-700/50 text-gray-500',
      },
    };
    return colorMap[assignee] || {
      active: 'bg-gray-600 border-gray-500 text-white',
      selected: 'bg-gray-600/70 border-gray-500/70 text-gray-200',
      inactive: 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300',
      badgeActive: 'bg-gray-700 text-gray-200',
      badgeInactive: 'bg-gray-700/50 text-gray-500',
    };
  };

  const getAssigneeColor = (assignee: string) => {
    const colors: { [key: string]: string } = {
      'Zac': 'bg-blue-600 hover:bg-blue-700 border-blue-500',
      'Luke': 'bg-green-600 hover:bg-green-700 border-green-500',
      'Dillon': 'bg-orange-600 hover:bg-orange-700 border-orange-500',
    };
    return colors[assignee] || 'bg-gray-600 hover:bg-gray-700 border-gray-500';
  };

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      'Tactstack': 'bg-orange-600 hover:bg-orange-700 border-orange-500',
      'Full Stack': 'bg-cyan-600 hover:bg-cyan-700 border-cyan-500',
      'Admin': 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500',
      'Marketing': 'bg-pink-600 hover:bg-pink-700 border-pink-500',
      'Deals': 'bg-green-600 hover:bg-green-700 border-green-500',
    };
    return colors[area] || 'bg-gray-600 hover:bg-gray-700 border-gray-500';
  };

  // Compact inline version for single row
  if (compact) {
    return (
      <>
        {/* Assignee Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold whitespace-nowrap">
            <User className="w-4 h-4" />
            <span>Assignee:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={setAllTasks}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm border ${
                selectedAssignees.length === 0
                  ? 'bg-slate-600 border-slate-500 text-white'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                selectedAssignees.length === 0
                  ? 'bg-slate-700 text-slate-100'
                  : 'bg-gray-700/50 text-gray-500'
              }`}>
                {totalAllTasks}
              </span>
            </button>

            {ASSIGNEES.map((assignee) => {
              const isOnlySelected = selectedAssignees.length === 1 && selectedAssignees[0] === assignee;
              const taskCount = workloadByAssignee[assignee] || 0;
              const colors = getAssigneeColorStates(assignee);

              return (
                <button
                  key={assignee}
                  onClick={() => setOnlyAssignee(assignee)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm border ${
                    isOnlySelected
                      ? colors.active
                      : colors.inactive
                  }`}
                >
                  <span>{assignee}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    isOnlySelected
                      ? colors.badgeActive
                      : colors.badgeInactive
                  }`}>
                    {taskCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-700/50"></div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
          />
        </div>
      </>
    );
  }

  // Original full-width version
  return (
    <div className="space-y-4">
      {/* Combined Row - Assignee Filters and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column: Assignee Filter */}
        <div className="flex items-center gap-3 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
          <div className="flex items-center gap-2 text-base text-gray-400 font-bold whitespace-nowrap w-[110px]">
            <User className="w-5 h-5" />
            <span>Assignee:</span>
          </div>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {/* All Tasks Button - Shows all tasks including unassigned */}
            <button
              onClick={setAllTasks}
              className={`px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 text-base border ${
                selectedAssignees.length === 0
                  ? 'bg-slate-600 border-slate-500 text-white'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300'
              }`}
            >
              <span>All Tasks</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                selectedAssignees.length === 0
                  ? 'bg-slate-700 text-slate-100'
                  : 'bg-gray-700/50 text-gray-500'
              }`}>
                {totalAllTasks}
              </span>
            </button>

            {/* Individual Team Members */}
            {ASSIGNEES.map((assignee) => {
              const isOnlySelected = selectedAssignees.length === 1 && selectedAssignees[0] === assignee;
              const isSelected = selectedAssignees.includes(assignee);
              const taskCount = workloadByAssignee[assignee] || 0;
              const colors = getAssigneeColorStates(assignee);

              return (
                <button
                  key={assignee}
                  onClick={() => setOnlyAssignee(assignee)}
                  className={`px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 text-base border ${
                    isOnlySelected
                      ? colors.active
                      : isSelected
                      ? colors.selected
                      : colors.inactive
                  }`}
                >
                  <span>{assignee}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    isOnlySelected || isSelected
                      ? colors.badgeActive
                      : colors.badgeInactive
                  }`}>
                    {taskCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Search and Filters */}
        <div className="flex items-center gap-3 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-colors whitespace-nowrap text-base font-bold ${
              activeFilterCount > 0
                ? 'bg-brand-500 border-brand-400 text-white'
                : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-1 bg-white/20 rounded-full text-sm font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear All Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 text-base font-bold text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2 border border-gray-700/50"
            >
              <X className="w-5 h-5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 space-y-4">
          {/* Assignee Filters */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              Team Members
              {selectedAssignees.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-full">
                  {selectedAssignees.length} selected
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ASSIGNEES.map((assignee) => (
                <button
                  key={assignee}
                  onClick={() => toggleAssignee(assignee)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                    selectedAssignees.includes(assignee)
                      ? `${getAssigneeColor(assignee)} text-white shadow-lg`
                      : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {assignee}
                </button>
              ))}
            </div>
          </div>

          {/* Area Filters */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              Areas
              {selectedAreas.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-full">
                  {selectedAreas.length} selected
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                    selectedAreas.includes(area)
                      ? `${getAreaColor(area)} text-white shadow-lg`
                      : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

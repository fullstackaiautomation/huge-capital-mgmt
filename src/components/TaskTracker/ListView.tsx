import { Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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

type ListViewProps = {
  tasks: Task[];
  updateTask: (taskId: string, field: keyof Task, value: string | boolean) => void;
  toggleCompleted: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
};

type SortField = 'dueDate' | 'taskName' | 'assignee' | 'area' | 'completed';
type SortDirection = 'asc' | 'desc';

export const ListView = ({ tasks, updateTask, toggleCompleted, deleteTask }: ListViewProps) => {
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [customAssignees, setCustomAssignees] = useState<string[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [assigneeColors, setAssigneeColors] = useState<{ [key: string]: string }>({});
  const [areaColors, setAreaColors] = useState<{ [key: string]: string }>({});

  // Available color palette (colors not used by defaults)
  const availableAssigneeColors = [
    'bg-indigo-600/30 text-indigo-300 border-indigo-400/40',
    'bg-pink-600/30 text-pink-300 border-pink-400/40',
    'bg-teal-600/30 text-teal-300 border-teal-400/40',
    'bg-amber-600/30 text-amber-300 border-amber-400/40',
    'bg-rose-600/30 text-rose-300 border-rose-400/40',
    'bg-emerald-600/30 text-emerald-300 border-emerald-400/40',
    'bg-violet-600/30 text-violet-300 border-violet-400/40',
    'bg-sky-600/30 text-sky-300 border-sky-400/40',
    'bg-lime-600/30 text-lime-300 border-lime-400/40',
    'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-400/40',
  ];

  const availableAreaColors = [
    'bg-red-600/30 text-red-300 border-red-400/40',
    'bg-indigo-600/30 text-indigo-300 border-indigo-400/40',
    'bg-purple-600/30 text-purple-300 border-purple-400/40',
    'bg-teal-600/30 text-teal-300 border-teal-400/40',
    'bg-lime-600/30 text-lime-300 border-lime-400/40',
    'bg-rose-600/30 text-rose-300 border-rose-400/40',
    'bg-sky-600/30 text-sky-300 border-sky-400/40',
    'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-400/40',
    'bg-emerald-600/30 text-emerald-300 border-emerald-400/40',
    'bg-amber-600/30 text-amber-300 border-amber-400/40',
  ];

  // Load custom options from database on mount
  useEffect(() => {
    const loadCustomOptions = async () => {
      // Load custom assignees
      const { data: assigneeData, error: assigneeError } = await supabase
        .from('custom_options')
        .select('name, color')
        .eq('type', 'assignee');

      if (assigneeError) {
        console.error('Error loading custom assignees:', assigneeError);
        if (assigneeError.code === '42P01') {
          console.error('Table custom_options does not exist. Please run the migration: supabase/migrations/create-custom-options-table.sql');
        }
      } else if (assigneeData) {
        const names = assigneeData.map(item => item.name);
        const colors = assigneeData.reduce((acc, item) => {
          acc[item.name] = item.color;
          return acc;
        }, {} as { [key: string]: string });

        setCustomAssignees(names);
        setAssigneeColors(colors);
      }

      // Load custom areas
      const { data: areaData, error: areaError } = await supabase
        .from('custom_options')
        .select('name, color')
        .eq('type', 'area');

      if (areaError) {
        console.error('Error loading custom areas:', areaError);
        if (areaError.code === '42P01') {
          console.error('Table custom_options does not exist. Please run the migration: supabase/migrations/create-custom-options-table.sql');
        }
      } else if (areaData) {
        const names = areaData.map(item => item.name);
        const colors = areaData.reduce((acc, item) => {
          acc[item.name] = item.color;
          return acc;
        }, {} as { [key: string]: string });

        setCustomAreas(names);
        setAreaColors(colors);
      }
    };

    loadCustomOptions();
  }, []);

  // Auto-resize all textareas on mount and when tasks change
  useEffect(() => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea[data-task-description]');
    textareas.forEach((textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, [tasks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle empty values
    if (!aValue && !bValue) return 0;
    if (!aValue) return sortDirection === 'asc' ? 1 : -1;
    if (!bValue) return sortDirection === 'asc' ? -1 : 1;

    // Special handling for dates
    if (sortField === 'dueDate') {
      const aDate = new Date(aValue).getTime();
      const bDate = new Date(bValue).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle boolean
    if (sortField === 'completed') {
      return sortDirection === 'asc'
        ? (aValue === bValue ? 0 : aValue ? 1 : -1)
        : (aValue === bValue ? 0 : aValue ? -1 : 1);
    }

    // Handle strings
    const result = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? result : -result;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-brand-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-brand-400" />
    );
  };

  const formatDueDate = (dateString: string) => {
    if (!dateString) return { text: '', isOverdue: false, isToday: false, displayDate: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [year, month, day] = dateString.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);

    const isOverdue = dueDate.getTime() < today.getTime();
    const isToday = dueDate.getTime() === today.getTime();
    const displayDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (isOverdue) {
      return { text: 'OVERDUE', isOverdue: true, isToday: false, displayDate };
    } else if (isToday) {
      return { text: 'Today', isOverdue: false, isToday: true, displayDate };
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return { text: 'Tomorrow', isOverdue: false, isToday: false, displayDate };
    } else {
      return { text: displayDate, isOverdue: false, isToday: false, displayDate };
    }
  };

  const getAssigneeColor = (assignee: string) => {
    const defaultColors: { [key: string]: string } = {
      'Zac': 'bg-blue-600/30 text-blue-300 border-blue-400/40',
      'Luke': 'bg-green-600/30 text-green-300 border-green-400/40',
      'Dillon': 'bg-orange-600/30 text-orange-300 border-orange-400/40',
    };

    if (defaultColors[assignee]) return defaultColors[assignee];
    if (assigneeColors[assignee]) return assigneeColors[assignee];
    return assignee ? 'bg-gray-600/30 text-gray-300 border-gray-400/40' : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  const getAreaColor = (area: string) => {
    const defaultColors: { [key: string]: string } = {
      'Tactstack': 'bg-orange-600/30 text-orange-300 border-orange-400/40',
      'Full Stack': 'bg-cyan-600/30 text-cyan-300 border-cyan-400/40',
      'Admin': 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
      'Marketing': 'bg-pink-600/30 text-pink-300 border-pink-400/40',
      'Deals': 'bg-green-600/30 text-green-300 border-green-400/40',
    };

    if (defaultColors[area]) return defaultColors[area];
    if (areaColors[area]) return areaColors[area];
    return area ? 'bg-gray-600/30 text-gray-300 border-gray-400/40' : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  const handleAssigneeChange = async (taskId: string, value: string) => {
    if (value === '__add_new__') {
      const newAssignee = prompt('Enter new assignee name:');
      if (newAssignee && newAssignee.trim()) {
        const trimmedName = newAssignee.trim();
        if (!customAssignees.includes(trimmedName)) {
          // Assign a color from available colors
          const usedColors = Object.values(assigneeColors);
          const nextColor = availableAssigneeColors.find(color => !usedColors.includes(color))
            || availableAssigneeColors[customAssignees.length % availableAssigneeColors.length];

          // Save to database
          const { error } = await supabase
            .from('custom_options')
            .insert({
              type: 'assignee',
              name: trimmedName,
              color: nextColor
            });

          if (!error) {
            setCustomAssignees([...customAssignees, trimmedName]);
            setAssigneeColors({ ...assigneeColors, [trimmedName]: nextColor });
          } else {
            console.error('Error saving custom assignee:', error);
            if (error.code === '42P01') {
              alert('Database table not found. Please ask your administrator to run the migration: supabase/migrations/create-custom-options-table.sql');
            } else {
              alert(`Failed to save custom assignee: ${error.message}`);
            }
          }
        }
        updateTask(taskId, 'assignee', trimmedName);
      }
    } else {
      updateTask(taskId, 'assignee', value);
    }
  };

  const handleAreaChange = async (taskId: string, value: string) => {
    if (value === '__add_new__') {
      const newArea = prompt('Enter new area name:');
      if (newArea && newArea.trim()) {
        const trimmedArea = newArea.trim();
        if (!customAreas.includes(trimmedArea)) {
          // Assign a color from available colors
          const usedColors = Object.values(areaColors);
          const nextColor = availableAreaColors.find(color => !usedColors.includes(color))
            || availableAreaColors[customAreas.length % availableAreaColors.length];

          // Save to database
          const { error } = await supabase
            .from('custom_options')
            .insert({
              type: 'area',
              name: trimmedArea,
              color: nextColor
            });

          if (!error) {
            setCustomAreas([...customAreas, trimmedArea]);
            setAreaColors({ ...areaColors, [trimmedArea]: nextColor });
          } else {
            console.error('Error saving custom area:', error);
            if (error.code === '42P01') {
              alert('Database table not found. Please ask your administrator to run the migration: supabase/migrations/create-custom-options-table.sql');
            } else {
              alert(`Failed to save custom area: ${error.message}`);
            }
          }
        }
        updateTask(taskId, 'area', trimmedArea);
      }
    } else {
      updateTask(taskId, 'area', value);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="grid grid-cols-[60px_100px_1fr_1fr_140px_140px_60px] gap-4 px-4 py-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <button
          onClick={() => handleSort('completed')}
          className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-200 text-base font-bold uppercase tracking-wide transition-colors"
        >
          <span>Done</span>
          <SortIcon field="completed" />
        </button>
        <button
          onClick={() => handleSort('dueDate')}
          className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-200 text-base font-bold uppercase tracking-wide transition-colors"
        >
          <span>Due</span>
          <SortIcon field="dueDate" />
        </button>
        <button
          onClick={() => handleSort('taskName')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-base font-bold uppercase tracking-wide transition-colors"
        >
          <span>Task</span>
          <SortIcon field="taskName" />
        </button>
        <div className="text-gray-400 text-base font-bold uppercase tracking-wide">Description</div>
        <button
          onClick={() => handleSort('assignee')}
          className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-200 text-base font-bold uppercase tracking-wide transition-colors"
        >
          <span>Assignee</span>
          <SortIcon field="assignee" />
        </button>
        <button
          onClick={() => handleSort('area')}
          className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-200 text-base font-bold uppercase tracking-wide transition-colors"
        >
          <span>Area</span>
          <SortIcon field="area" />
        </button>
        <div className="text-gray-400 text-base font-bold uppercase tracking-wide text-center"></div>
      </div>

      {/* Task Cards */}
      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const getCardColor = () => {
            if (task.assignee === 'Zac') return 'bg-blue-500/10 border-l-blue-500';
            if (task.assignee === 'Luke') return 'bg-green-500/10 border-l-green-500';
            if (task.assignee === 'Dillon') return 'bg-orange-500/10 border-l-orange-500';
            return 'bg-gray-800/40 border-l-gray-600';
          };

          return (
            <div
              key={task.id}
              className={`grid grid-cols-[60px_100px_1fr_1fr_140px_140px_60px] gap-4 px-4 py-5 backdrop-blur-sm rounded-lg border-l-4 border border-gray-700/50 hover:brightness-110 transition-all ${getCardColor()} ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded border-2 border-gray-600 text-brand-500 focus:ring-2 focus:ring-brand-500/50 cursor-pointer transition-all hover:scale-110"
                  checked={task.completed}
                  onChange={() => toggleCompleted(task.id)}
                />
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-center">
                {(() => {
                  if (task.completed && task.completed_date) {
                    const completedDate = new Date(task.completed_date);
                    const displayDate = completedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <div className="rounded-lg px-3 py-3 border bg-green-600/20 border-green-500/40 min-w-[90px] text-center">
                        <div className="text-xs text-green-400 font-bold uppercase tracking-wider">Done</div>
                        <div className="text-green-300 text-base font-bold">{displayDate}</div>
                      </div>
                    );
                  }

                  const dateInfo = task.dueDate
                    ? formatDueDate(task.dueDate)
                    : { text: 'Set', isOverdue: false, isToday: false, displayDate: '' };
                  return (
                    <div
                      className={`rounded-lg px-3 py-3 border min-w-[90px] cursor-pointer transition-all hover:scale-105 text-center relative ${
                        dateInfo.isOverdue
                          ? 'bg-red-600/20 border-red-500/40 hover:bg-red-600/30'
                          : dateInfo.isToday
                          ? 'bg-yellow-600/20 border-yellow-500/40 hover:bg-yellow-600/30'
                          : 'bg-gray-700/30 border-gray-600/40 hover:bg-gray-700/50'
                      }`}
                      onClick={(e) => {
                        const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                        if (input) input.showPicker();
                      }}
                    >
                      <div
                        className={`text-xs font-bold uppercase tracking-wider ${
                          dateInfo.isOverdue
                            ? 'text-red-400'
                            : dateInfo.isToday
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {dateInfo.isOverdue ? 'Overdue' : dateInfo.isToday ? 'Today' : 'Due'}
                      </div>
                      <div
                        className={`text-base font-bold ${
                          dateInfo.isOverdue
                            ? 'text-red-300'
                            : dateInfo.isToday
                            ? 'text-yellow-300'
                            : 'text-gray-100'
                        }`}
                      >
                        {dateInfo.isOverdue ? dateInfo.displayDate : dateInfo.text || 'Set'}
                      </div>
                      <input
                        type="date"
                        className="absolute opacity-0 pointer-events-none"
                        value={task.dueDate}
                        onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Task Name */}
              <div className="flex items-center">
                <input
                  type="text"
                  className={`w-full bg-transparent text-gray-100 font-semibold text-lg focus:outline-none focus:bg-gray-900/20 rounded-md px-3 py-2 transition-all ${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}
                  placeholder="Enter task name..."
                  value={task.taskName}
                  onChange={(e) => updateTask(task.id, 'taskName', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="flex items-start">
                <textarea
                  data-task-description
                  className={`w-full bg-transparent text-gray-200 text-lg focus:outline-none focus:bg-gray-900/20 rounded-md px-3 py-2 transition-all resize-none overflow-hidden ${
                    task.completed ? 'line-through text-gray-500' : ''
                  }`}
                  placeholder="Add description..."
                  value={task.description}
                  onChange={(e) => {
                    updateTask(task.id, 'description', e.target.value);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  rows={1}
                />
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-center">
                <select
                  className={`w-full border rounded-lg px-4 py-3.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer ${getAssigneeColor(
                    task.assignee
                  )}`}
                  value={task.assignee}
                  onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                >
                  <option value="" className="bg-gray-800 text-gray-400">
                    Assign
                  </option>
                  <option value="Zac" className="bg-gray-800">
                    Zac
                  </option>
                  <option value="Luke" className="bg-gray-800">
                    Luke
                  </option>
                  <option value="Dillon" className="bg-gray-800">
                    Dillon
                  </option>
                  {customAssignees.map((assignee) => (
                    <option key={assignee} value={assignee} className="bg-gray-800">
                      {assignee}
                    </option>
                  ))}
                  <option value="__add_new__" className="bg-gray-700 text-brand-400 font-bold">
                    + Add New...
                  </option>
                </select>
              </div>

              {/* Area */}
              <div className="flex items-center justify-center">
                <select
                  className={`w-full border rounded-lg px-4 py-3.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer ${getAreaColor(
                    task.area
                  )}`}
                  value={task.area}
                  onChange={(e) => handleAreaChange(task.id, e.target.value)}
                >
                  <option value="" className="bg-gray-800 text-gray-400">
                    Area
                  </option>
                  <option value="Tactstack" className="bg-gray-800">
                    Tactstack
                  </option>
                  <option value="Full Stack" className="bg-gray-800">
                    Full Stack
                  </option>
                  <option value="Admin" className="bg-gray-800">
                    Admin
                  </option>
                  <option value="Marketing" className="bg-gray-800">
                    Marketing
                  </option>
                  <option value="Deals" className="bg-gray-800">
                    Deals
                  </option>
                  {customAreas.map((area) => (
                    <option key={area} value={area} className="bg-gray-800">
                      {area}
                    </option>
                  ))}
                  <option value="__add_new__" className="bg-gray-700 text-brand-400 font-bold">
                    + Add New...
                  </option>
                </select>
              </div>

              {/* Delete */}
              <div className="flex items-center justify-center">
                <button
                  onDoubleClick={() => deleteTask(task.id)}
                  className="text-red-400 hover:text-red-300 transition-all p-2 hover:bg-red-500/20 rounded-md hover:scale-110"
                  title="Double-click to delete task"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-gray-800/20 rounded-lg border border-gray-700/30">
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
};

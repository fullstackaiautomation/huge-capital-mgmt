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
    'bg-indigo-900/20 text-indigo-400 border-indigo-800/30',
    'bg-pink-900/20 text-pink-400 border-pink-800/30',
    'bg-teal-900/20 text-teal-400 border-teal-800/30',
    'bg-amber-900/20 text-amber-400 border-amber-800/30',
    'bg-rose-900/20 text-rose-400 border-rose-800/30',
    'bg-emerald-900/20 text-emerald-400 border-emerald-800/30',
    'bg-violet-900/20 text-violet-400 border-violet-800/30',
    'bg-sky-900/20 text-sky-400 border-sky-800/30',
    'bg-lime-900/20 text-lime-400 border-lime-800/30',
    'bg-fuchsia-900/20 text-fuchsia-400 border-fuchsia-800/30',
  ];

  const availableAreaColors = [
    'bg-red-900/20 text-red-400 border-red-800/30',
    'bg-indigo-900/20 text-indigo-400 border-indigo-800/30',
    'bg-purple-900/20 text-purple-400 border-purple-800/30',
    'bg-teal-900/20 text-teal-400 border-teal-800/30',
    'bg-lime-900/20 text-lime-400 border-lime-800/30',
    'bg-rose-900/20 text-rose-400 border-rose-800/30',
    'bg-sky-900/20 text-sky-400 border-sky-800/30',
    'bg-fuchsia-900/20 text-fuchsia-400 border-fuchsia-800/30',
    'bg-emerald-900/20 text-emerald-400 border-emerald-800/30',
    'bg-amber-900/20 text-amber-400 border-amber-800/30',
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
      return <ArrowUpDown className="w-3 h-3 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-400" />
    );
  };

  const formatDueDate = (dateString: string) => {
    if (!dateString) return { text: '', isOverdue: false, isToday: false, isTomorrow: false, displayDate: '', daysOverdue: 0, daysUntilDue: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [year, month, day] = dateString.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);

    const isOverdue = dueDate.getTime() < today.getTime();
    const isToday = dueDate.getTime() === today.getTime();
    const isTomorrow = dueDate.getTime() === tomorrow.getTime();
    const displayDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Calculate days difference
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / msPerDay);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / msPerDay);

    if (isOverdue) {
      return { text: 'OVERDUE', isOverdue: true, isToday: false, isTomorrow: false, displayDate, daysOverdue, daysUntilDue: 0 };
    } else if (isToday) {
      return { text: 'Today', isOverdue: false, isToday: true, isTomorrow: false, displayDate, daysOverdue: 0, daysUntilDue: 0 };
    } else if (isTomorrow) {
      return { text: 'Tomorrow', isOverdue: false, isToday: false, isTomorrow: true, displayDate, daysOverdue: 0, daysUntilDue: 1 };
    } else {
      // For future dates, return days until due
      const daysText = daysUntilDue === 1 ? '1 day' : `${daysUntilDue} days`;
      return { text: daysText, isOverdue: false, isToday: false, isTomorrow: false, displayDate, daysOverdue: 0, daysUntilDue };
    }
  };

  const getAssigneeColor = (assignee: string) => {
    const defaultColors: { [key: string]: string } = {
      'Zac': 'bg-blue-900/20 text-blue-400 border-blue-800/30',
      'Luke': 'bg-green-900/20 text-green-400 border-green-800/30',
      'Dillon': 'bg-orange-900/20 text-orange-400 border-orange-800/30',
    };

    if (defaultColors[assignee]) return defaultColors[assignee];
    if (assigneeColors[assignee]) return assigneeColors[assignee];
    return assignee ? 'bg-gray-700/20 text-gray-400 border-gray-700/30' : 'bg-gray-700/20 text-gray-400 border-gray-700/30';
  };

  const getAreaColor = (area: string) => {
    const defaultColors: { [key: string]: string } = {
      'Tactstack': 'bg-orange-900/20 text-orange-400 border-orange-800/30',
      'Full Stack': 'bg-cyan-900/20 text-cyan-400 border-cyan-800/30',
      'Admin': 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
      'Marketing': 'bg-pink-900/20 text-pink-400 border-pink-800/30',
      'Deals': 'bg-green-900/20 text-green-400 border-green-800/30',
    };

    if (defaultColors[area]) return defaultColors[area];
    if (areaColors[area]) return areaColors[area];
    return area ? 'bg-gray-700/20 text-gray-400 border-gray-700/30' : 'bg-gray-700/20 text-gray-400 border-gray-700/30';
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
      <div className="grid grid-cols-[60px_100px_1fr_1fr_140px_140px_60px] gap-4 px-4 py-2 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <button
          onClick={() => handleSort('completed')}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <span>Done</span>
          <SortIcon field="completed" />
        </button>
        <button
          onClick={() => handleSort('dueDate')}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <span>Due</span>
          <SortIcon field="dueDate" />
        </button>
        <button
          onClick={() => handleSort('taskName')}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <span>Task</span>
          <SortIcon field="taskName" />
        </button>
        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Description</div>
        <button
          onClick={() => handleSort('assignee')}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <span>Assignee</span>
          <SortIcon field="assignee" />
        </button>
        <button
          onClick={() => handleSort('area')}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <span>Area</span>
          <SortIcon field="area" />
        </button>
        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider text-center"></div>
      </div>

      {/* Task Cards */}
      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const getCardColor = () => {
            if (task.assignee === 'Zac') return 'bg-blue-950/20 border-l-blue-700';
            if (task.assignee === 'Luke') return 'bg-green-950/20 border-l-green-700';
            if (task.assignee === 'Dillon') return 'bg-orange-950/20 border-l-orange-700';
            return 'bg-gray-900/30 border-l-gray-700';
          };

          return (
            <div
              key={task.id}
              className={`grid grid-cols-[60px_100px_1fr_1fr_140px_140px_60px] gap-4 px-4 py-2 backdrop-blur-sm rounded-lg border-l-4 border border-gray-700/50 hover:brightness-110 transition-all ${getCardColor()} ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-2 border-gray-600 text-brand-500 focus:ring-2 focus:ring-brand-500/50 cursor-pointer transition-all hover:scale-110"
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
                      <div className="rounded-lg px-2 py-1.5 border bg-green-900/15 border-green-800/30 min-w-[85px] text-center">
                        <div className="text-xs text-green-500 font-semibold uppercase tracking-wider">Done</div>
                        <div className="text-green-400 text-sm font-semibold">{displayDate}</div>
                      </div>
                    );
                  }

                  const dateInfo = task.dueDate
                    ? formatDueDate(task.dueDate)
                    : { text: 'Set', isOverdue: false, isToday: false, isTomorrow: false, displayDate: '', daysOverdue: 0, daysUntilDue: 0 };
                  return (
                    <div
                      className={`rounded-lg px-2 py-1.5 border min-w-[85px] cursor-pointer transition-all hover:scale-105 text-center relative ${
                        dateInfo.isOverdue
                          ? 'bg-red-900/15 border-red-800/30 hover:bg-red-900/25'
                          : dateInfo.isToday
                          ? 'bg-yellow-900/15 border-yellow-800/30 hover:bg-yellow-900/25'
                          : dateInfo.isTomorrow
                          ? 'bg-purple-900/15 border-purple-800/30 hover:bg-purple-900/25'
                          : 'bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/30'
                      }`}
                      onClick={(e) => {
                        const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                        if (input) input.showPicker();
                      }}
                    >
                      <div
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          dateInfo.isOverdue
                            ? 'text-red-500'
                            : dateInfo.isToday
                            ? 'text-yellow-500'
                            : dateInfo.isTomorrow
                            ? 'text-purple-500'
                            : 'text-gray-500'
                        }`}
                      >
                        {dateInfo.isOverdue ? 'Overdue' : dateInfo.isToday ? 'Due' : 'Due'}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          dateInfo.isOverdue
                            ? 'text-red-400'
                            : dateInfo.isToday
                            ? 'text-yellow-400'
                            : dateInfo.isTomorrow
                            ? 'text-purple-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {dateInfo.isOverdue
                          ? dateInfo.daysOverdue === 1
                            ? '1 day'
                            : `${dateInfo.daysOverdue} days`
                          : dateInfo.text || 'Set'}
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
                  className={`w-full bg-transparent text-gray-100 font-semibold text-sm focus:outline-none focus:bg-gray-900/20 rounded-md px-2 py-1 transition-all ${
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
                  className={`w-full bg-transparent text-gray-200 text-sm focus:outline-none focus:bg-gray-900/20 rounded-md px-2 py-1 transition-all resize-none overflow-hidden ${
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
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer ${getAssigneeColor(
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
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer ${getAreaColor(
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

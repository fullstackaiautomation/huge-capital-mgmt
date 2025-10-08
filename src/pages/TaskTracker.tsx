import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { useTaskTracker } from '../hooks/useTaskTracker';
import { useState } from 'react';

type Task = {
  id: string;
  taskName: string;
  description: string;
  assignee: 'Zac' | 'Luke' | 'Dillion' | '';
  area: 'Tactstack' | 'Full Stack' | 'Admin' | 'Marketing' | '';
  dueDate: string;
  completed: boolean;
  completed_date?: string;
};

export const TaskTracker = () => {
  const { tasks, setTasks, saveTask, deleteTask: deleteTaskFromDb } = useTaskTracker();
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredTasks = showCompleted
    ? tasks.filter(task => task.completed)
    : tasks.filter(task => !task.completed);

  const formatDueDate = (dateString: string) => {
    if (!dateString) return { text: '', isOverdue: false, isToday: false, displayDate: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parse date as local time, not UTC
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

  const addNewTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      taskName: '',
      description: '',
      assignee: '',
      area: '',
      dueDate: '',
      completed: false,
      completed_date: undefined,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTask(newTask);
  };

  const updateTask = (taskId: string, field: keyof Task, value: string | boolean) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);

    const updatedTask = updatedTasks.find(task => task.id === taskId);
    if (updatedTask) {
      if ((window as any).saveTaskTimeout) {
        clearTimeout((window as any).saveTaskTimeout);
      }
      (window as any).saveTaskTimeout = setTimeout(() => {
        saveTask(updatedTask);
      }, 1000);
    }
  };

  const toggleCompleted = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;
    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? {
            ...t,
            completed: newCompletedState,
            completed_date: newCompletedState ? new Date().toISOString() : undefined
          }
        : t
    );
    setTasks(updatedTasks);

    const updatedTask = updatedTasks.find(t => t.id === taskId);
    if (updatedTask) {
      saveTask(updatedTask);
    }
  };

  const deleteTask = (taskId: string) => {
    deleteTaskFromDb(taskId);
  };

  const getAssigneeColor = (assignee: string) => {
    const colors: { [key: string]: string } = {
      'Zac': 'bg-blue-600/30 text-blue-300 border-blue-400/40',
      'Luke': 'bg-green-600/30 text-green-300 border-green-400/40',
      'Dillion': 'bg-purple-600/30 text-purple-300 border-purple-400/40',
    };
    return assignee ? colors[assignee] || 'bg-gray-600/30 text-gray-300 border-gray-400/40' : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      'Tactstack': 'bg-orange-600/30 text-orange-300 border-orange-400/40',
      'Full Stack': 'bg-cyan-600/30 text-cyan-300 border-cyan-400/40',
      'Admin': 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
      'Marketing': 'bg-pink-600/30 text-pink-300 border-pink-400/40',
    };
    return area ? colors[area] || 'bg-gray-600/30 text-gray-300 border-gray-400/40' : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-brand-500" />
          Task Tracker
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
            <button
              onClick={() => setShowCompleted(false)}
              className={`px-4 py-2 rounded-md transition-colors ${
                !showCompleted
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Open Tasks ({tasks.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showCompleted
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Completed ({tasks.filter(t => t.completed).length})
            </button>
          </div>
          <button
            onClick={addNewTask}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-500/50"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-800/80">
                <th className="text-center py-3 px-3 text-gray-400 font-medium text-sm w-[120px]">
                  Due Date
                </th>
                <th className="text-center py-3 px-2 text-gray-400 font-medium text-sm w-[70px]">
                  Complete
                </th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm w-[200px]">
                  Task
                </th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm w-[250px]">
                  Description
                </th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium text-sm w-[100px]">
                  Assignee
                </th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium text-sm w-[100px]">
                  Area
                </th>
                <th className="text-center py-3 px-2 text-gray-400 font-medium text-sm w-[50px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const getRowColor = () => {
                  if (task.assignee === 'Zac') return 'bg-blue-500/20 border-l-4 border-l-blue-500';
                  if (task.assignee === 'Luke') return 'bg-green-500/20 border-l-4 border-l-green-500';
                  if (task.assignee === 'Dillion') return 'bg-purple-500/20 border-l-4 border-l-purple-500';
                  return '';
                };

                return (
                <tr key={task.id} className={`border-b border-gray-700/50 hover:bg-brand-500/5 transition-colors ${task.completed ? 'opacity-50' : ''} ${getRowColor()}`}>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {(() => {
                          // If task is completed, show completed date in green
                          if (task.completed && task.completed_date) {
                            const completedDate = new Date(task.completed_date);
                            const displayDate = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return (
                              <div className="rounded-lg px-3 py-2 border min-w-[100px] bg-green-600/30 border-green-500/50">
                                <div className="text-[10px] text-green-300 font-semibold uppercase tracking-wider">
                                  Completed
                                </div>
                                <div className="text-green-200 text-sm font-bold text-center">
                                  {displayDate}
                                </div>
                              </div>
                            );
                          }

                          // Otherwise show due date
                          const dateInfo = task.dueDate ? formatDueDate(task.dueDate) : { text: 'Set date', isOverdue: false, isToday: false, displayDate: '' };
                          return (
                            <div
                              className={`rounded-lg px-3 py-2 border min-w-[100px] cursor-pointer transition-colors relative ${
                                dateInfo.isOverdue
                                  ? 'bg-red-600/30 border-red-500/50 hover:bg-red-600/40'
                                  : dateInfo.isToday
                                  ? 'bg-yellow-600/30 border-yellow-500/50 hover:bg-yellow-600/40'
                                  : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                              }`}
                              onClick={(e) => {
                                const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                                if (input) input.showPicker();
                              }}
                            >
                              {dateInfo.isOverdue ? (
                                <>
                                  <div className="text-[10px] text-red-300 font-semibold uppercase tracking-wider">
                                    {dateInfo.text}
                                  </div>
                                  <div className={`text-red-200 text-sm font-bold text-center mt-0.5 ${task.completed ? 'line-through' : ''}`}>
                                    {dateInfo.displayDate}
                                  </div>
                                </>
                              ) : dateInfo.isToday ? (
                                <>
                                  <div className="text-[10px] text-yellow-300 font-semibold uppercase tracking-wider">
                                    Due
                                  </div>
                                  <div className={`text-yellow-200 text-sm font-bold text-center ${task.completed ? 'line-through' : ''}`}>
                                    {dateInfo.text}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                    Due
                                  </div>
                                  <div className={`text-white text-sm font-bold text-center ${task.completed ? 'line-through' : ''}`}>
                                    {dateInfo.text || 'Set date'}
                                  </div>
                                </>
                              )}
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
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-600 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        checked={task.completed}
                        onChange={() => toggleCompleted(task.id)}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        className={`w-full bg-transparent text-gray-100 font-medium focus:outline-none focus:bg-brand-500/10 rounded px-2 py-1 ${task.completed ? 'line-through' : ''}`}
                        placeholder="Enter task..."
                        value={task.taskName}
                        onChange={(e) => updateTask(task.id, 'taskName', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-3 align-middle">
                      <textarea
                        className={`w-full bg-transparent text-gray-100 text-sm focus:outline-none focus:bg-brand-500/10 rounded px-2 py-1 resize-none ${task.completed ? 'line-through' : ''}`}
                        placeholder="Enter description..."
                        value={task.description}
                        rows={2}
                        onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        className={`border rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all ${getAssigneeColor(task.assignee)}`}
                        value={task.assignee}
                        onChange={(e) => updateTask(task.id, 'assignee', e.target.value)}
                      >
                        <option value="" className="bg-gray-800 text-gray-400">Select</option>
                        <option value="Zac" className="bg-gray-800">Zac</option>
                        <option value="Luke" className="bg-gray-800">Luke</option>
                        <option value="Dillion" className="bg-gray-800">Dillion</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        className={`border rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all ${getAreaColor(task.area)}`}
                        value={task.area}
                        onChange={(e) => updateTask(task.id, 'area', e.target.value)}
                      >
                        <option value="" className="bg-gray-800 text-gray-400">Select</option>
                        <option value="Tactstack" className="bg-gray-800">Tactstack</option>
                        <option value="Full Stack" className="bg-gray-800">Full Stack</option>
                        <option value="Admin" className="bg-gray-800">Admin</option>
                        <option value="Marketing" className="bg-gray-800">Marketing</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No tasks yet. Click "Add Task" to create your first task.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

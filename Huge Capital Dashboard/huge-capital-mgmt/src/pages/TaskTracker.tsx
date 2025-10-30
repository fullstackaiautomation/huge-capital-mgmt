import { Plus, CheckSquare, ListChecks } from 'lucide-react';
import { useTaskTracker } from '../hooks/useTaskTracker';
import { useState, useMemo } from 'react';
import { FilterBar } from '../components/TaskTracker/FilterBar';
import { ViewToggle, type ViewMode } from '../components/TaskTracker/ViewToggle';
import { ListView } from '../components/TaskTracker/ListView';
import { BoardView } from '../components/TaskTracker/BoardView';
import { CalendarView } from '../components/TaskTracker/CalendarView';
import { AddTaskModal } from '../components/TaskTracker/AddTaskModal';

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

type TaskFilter = 'all' | 'open' | 'completed';

export const TaskTracker = () => {
  const { tasks, setTasks, saveTask, deleteTask: deleteTaskFromDb } = useTaskTracker();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('open');
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Apply all filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Completed filter
      if (taskFilter === 'open' && task.completed) return false;
      if (taskFilter === 'completed' && !task.completed) return false;

      // Assignee filter
      if (selectedAssignees.length > 0 && !selectedAssignees.includes(task.assignee)) {
        return false;
      }

      // Area filter
      if (selectedAreas.length > 0 && !selectedAreas.includes(task.area)) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTask = task.taskName?.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesAssignee = task.assignee?.toLowerCase().includes(query);
        const matchesArea = task.area?.toLowerCase().includes(query);

        if (!matchesTask && !matchesDescription && !matchesAssignee && !matchesArea) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, taskFilter, selectedAssignees, selectedAreas, searchQuery]);

  const addNewTask = () => {
    setIsAddTaskModalOpen(true);
  };

  const handleSaveNewTask = (taskData: Omit<Task, 'id' | 'completed' | 'completed_date'>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...taskData,
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

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header - Title and View Toggle Only */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
          <CheckSquare className="w-10 h-10 text-brand-500" />
          Task Tracker
        </h1>
        {/* View Toggle */}
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Unified Control Bar - Everything in one row */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
        <div className="flex items-center gap-6 flex-wrap lg:flex-nowrap">
          {/* Status Filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold whitespace-nowrap">
              <ListChecks className="w-4 h-4" />
              <span>Status:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTaskFilter('open')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm border ${
                  taskFilter === 'open'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300'
                }`}
              >
                <span>Open</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  taskFilter === 'open'
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-gray-700/50 text-gray-500'
                }`}>
                  {tasks.filter(t => !t.completed).length}
                </span>
              </button>

              <button
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm border ${
                  taskFilter === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300'
                }`}
              >
                <span>Completed</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  taskFilter === 'completed'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-gray-700/50 text-gray-500'
                }`}>
                  {tasks.filter(t => t.completed).length}
                </span>
              </button>

              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm border ${
                  taskFilter === 'all'
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800/70 hover:text-gray-300'
                }`}
              >
                <span>All Tasks</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  taskFilter === 'all'
                    ? 'bg-purple-700 text-purple-100'
                    : 'bg-gray-700/50 text-gray-500'
                }`}>
                  {tasks.length}
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-700/50"></div>

          {/* Assignee Filters */}
          <FilterBar
            selectedAssignees={selectedAssignees}
            selectedAreas={selectedAreas}
            searchQuery={searchQuery}
            tasks={tasks}
            onAssigneesChange={setSelectedAssignees}
            onAreasChange={setSelectedAreas}
            onSearchChange={setSearchQuery}
            compact={true}
          />

          {/* Add Task Button - Pushed to the right */}
          <div className="ml-auto">
            <button
              onClick={addNewTask}
              className="flex items-center gap-2 px-4 py-2 font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* View-specific Content */}
      {currentView === 'list' && (
        <ListView
          tasks={filteredTasks}
          updateTask={updateTask}
          toggleCompleted={toggleCompleted}
          deleteTask={deleteTask}
        />
      )}

      {currentView === 'board' && (
        <BoardView
          tasks={filteredTasks}
          onToggleComplete={toggleCompleted}
          onDeleteTask={deleteTask}
        />
      )}

      {currentView === 'calendar' && (
        <CalendarView tasks={filteredTasks} />
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No tasks match your current filters</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
          <p className="text-gray-500 text-sm">Click "Add Task" to create your first task</p>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSave={handleSaveNewTask}
      />
    </div>
  );
};

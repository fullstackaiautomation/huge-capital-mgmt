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
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
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

      {/* Task Status Filters and Add Task Button */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Status Filter Box - Matches left column width */}
        <div className="flex items-center gap-3 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
          <div className="flex items-center gap-2 text-base text-gray-400 font-bold whitespace-nowrap w-[110px]">
            <ListChecks className="w-5 h-5" />
            <span>Status:</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Task Filter Toggle */}
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-5 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 text-base border-2 ${
                taskFilter === 'all'
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30 hover:border-purple-500/50'
              }`}
            >
              <span>All Tasks</span>
              <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                taskFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-500/30 text-purple-200'
              }`}>
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => setTaskFilter('open')}
              className={`px-5 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 text-base border-2 ${
                taskFilter === 'open'
                  ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/30'
                  : 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30 hover:border-yellow-400/50'
              }`}
            >
              <span>Open</span>
              <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                taskFilter === 'open'
                  ? 'bg-white/20 text-white'
                  : 'bg-yellow-400/30 text-yellow-200'
              }`}>
                {tasks.filter(t => !t.completed).length}
              </span>
            </button>

            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-5 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 text-base border-2 ${
                taskFilter === 'completed'
                  ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600/30 hover:border-green-500/50'
              }`}
            >
              <span>Completed</span>
              <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                taskFilter === 'completed'
                  ? 'bg-white/20 text-white'
                  : 'bg-green-500/30 text-green-200'
              }`}>
                {tasks.filter(t => t.completed).length}
              </span>
            </button>
          </div>
        </div>

        {/* Add Task Button - Right column */}
        <div className="flex items-center">
          <button
            onClick={addNewTask}
            className="flex items-center justify-center gap-2 px-10 py-3 text-lg font-bold bg-emerald-600 border-2 border-emerald-500 text-white rounded-lg hover:bg-emerald-700 hover:border-emerald-600 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30 h-full"
          >
            <Plus className="w-6 h-6" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filter Bar with Integrated Workload */}
      <FilterBar
        selectedAssignees={selectedAssignees}
        selectedAreas={selectedAreas}
        searchQuery={searchQuery}
        tasks={tasks}
        onAssigneesChange={setSelectedAssignees}
        onAreasChange={setSelectedAreas}
        onSearchChange={setSearchQuery}
      />

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

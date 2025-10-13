import { Plus, CheckSquare } from 'lucide-react';
import { useTaskTracker } from '../hooks/useTaskTracker';
import { useState, useMemo } from 'react';
import { FilterBar } from '../components/TaskTracker/FilterBar';
import { ViewToggle, type ViewMode } from '../components/TaskTracker/ViewToggle';
import { ListView } from '../components/TaskTracker/ListView';
import { BoardView } from '../components/TaskTracker/BoardView';
import { CalendarView } from '../components/TaskTracker/CalendarView';

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

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
          <CheckSquare className="w-10 h-10 text-brand-500" />
          Task Tracker
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          {/* View Toggle */}
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />

          {/* Task Filter Toggle */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1.5 border border-gray-700/50">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-5 py-3 rounded-md transition-colors text-base font-bold ${
                taskFilter === 'all' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setTaskFilter('open')}
              className={`px-5 py-3 rounded-md transition-colors text-base font-bold ${
                taskFilter === 'open' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Open ({tasks.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-5 py-3 rounded-md transition-colors text-base font-bold ${
                taskFilter === 'completed' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Completed ({tasks.filter(t => t.completed).length})
            </button>
          </div>

          {/* Add Task Button */}
          <button
            onClick={addNewTask}
            className="flex items-center gap-2 px-5 py-3 text-base font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-500/50"
          >
            <Plus className="w-5 h-5" />
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
    </div>
  );
};

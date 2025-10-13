import { CheckCircle2, Circle, Calendar, User, Trash2, Tag } from 'lucide-react';
import { useMemo } from 'react';

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

type BoardViewProps = {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onToggleComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
};

export const BoardView = ({ tasks, onTaskClick, onToggleComplete, onDeleteTask }: BoardViewProps) => {
  const columns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      overdue: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const [year, month, day] = t.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        return dueDate.getTime() < today.getTime();
      }),
      today: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const [year, month, day] = t.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        return dueDate.getTime() === today.getTime();
      }),
      upcoming: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const [year, month, day] = t.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        return dueDate.getTime() > today.getTime() && dueDate.getTime() < nextWeek.getTime();
      }),
      later: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const [year, month, day] = t.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        return dueDate.getTime() >= nextWeek.getTime();
      }),
      noDueDate: tasks.filter(t => !t.completed && !t.dueDate),
      completed: tasks.filter(t => t.completed),
    };
  }, [tasks]);

  const columnConfig = [
    { key: 'overdue', title: 'Overdue', color: 'border-red-500/50 bg-red-500/5', headerColor: 'bg-red-500/20 text-red-300' },
    { key: 'today', title: 'Due Today', color: 'border-yellow-500/50 bg-yellow-500/5', headerColor: 'bg-yellow-500/20 text-yellow-300' },
    { key: 'upcoming', title: 'This Week', color: 'border-blue-500/50 bg-blue-500/5', headerColor: 'bg-blue-500/20 text-blue-300' },
    { key: 'later', title: 'Later', color: 'border-gray-500/50 bg-gray-500/5', headerColor: 'bg-gray-500/20 text-gray-300' },
    { key: 'noDueDate', title: 'No Due Date', color: 'border-gray-600/50 bg-gray-600/5', headerColor: 'bg-gray-600/20 text-gray-400' },
    { key: 'completed', title: 'Completed', color: 'border-green-500/50 bg-green-500/5', headerColor: 'bg-green-500/20 text-green-300' },
  ];

  const getAssigneeColor = (assignee: string) => {
    const colors: { [key: string]: string } = {
      'Zac': 'bg-blue-600/30 text-blue-300 border-blue-400/40',
      'Luke': 'bg-green-600/30 text-green-300 border-green-400/40',
      'Dillon': 'bg-purple-600/30 text-purple-300 border-purple-400/40',
    };
    return assignee ? colors[assignee] : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      'Tactstack': 'bg-orange-600/30 text-orange-300 border-orange-400/40',
      'Full Stack': 'bg-cyan-600/30 text-cyan-300 border-cyan-400/40',
      'Admin': 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
      'Marketing': 'bg-pink-600/30 text-pink-300 border-pink-400/40',
      'Deals': 'bg-green-600/30 text-green-300 border-green-400/40',
    };
    return area ? colors[area] : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  const formatDueDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 hover:border-gray-600/50 transition-all cursor-pointer group"
      onClick={() => onTaskClick?.(task)}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className={`font-semibold text-gray-100 flex-1 ${task.completed ? 'line-through opacity-60' : ''}`}>
          {task.taskName || 'Untitled Task'}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(task.id);
            }}
            className="p-1 hover:bg-gray-700/50 rounded transition-colors"
            title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 hover:text-brand-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask?.(task.id);
            }}
            className="p-1 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className={`text-sm text-gray-400 mb-3 line-clamp-2 ${task.completed ? 'line-through opacity-60' : ''}`}>
          {task.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
            <Calendar className="w-3 h-3" />
            <span>{formatDueDate(task.dueDate)}</span>
          </div>
        )}
        {task.assignee && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${getAssigneeColor(task.assignee)}`}>
            <User className="w-3 h-3" />
            <span>{task.assignee}</span>
          </div>
        )}
        {task.area && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${getAreaColor(task.area)}`}>
            <Tag className="w-3 h-3" />
            <span>{task.area}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {columnConfig.map((column) => {
        const columnTasks = columns[column.key as keyof typeof columns];
        return (
          <div
            key={column.key}
            className={`rounded-lg border ${column.color} p-4 flex flex-col h-fit`}
          >
            {/* Column Header */}
            <div className={`${column.headerColor} rounded-lg px-3 py-2 mb-4 flex items-center justify-between`}>
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm font-bold">{columnTasks.length}</span>
            </div>

            {/* Tasks */}
            <div className="space-y-3 flex-1">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

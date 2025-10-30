import { TrendingUp, Users, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

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

type TaskStatsProps = {
  tasks: Task[];
};

export const TaskStats = ({ tasks }: TaskStatsProps) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const openTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate overdue tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const [year, month, day] = t.dueDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    return dueDate.getTime() < today.getTime();
  }).length;

  // Calculate tasks due today
  const tasksDueToday = tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const [year, month, day] = t.dueDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    return dueDate.getTime() === today.getTime();
  }).length;

  // Calculate workload by assignee
  const workloadByAssignee = tasks
    .filter(t => !t.completed && t.assignee)
    .reduce((acc, task) => {
      const assignee = task.assignee;
      if (assignee) {
        acc[assignee] = (acc[assignee] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

  const assigneeColors: Record<string, { bg: string; text: string }> = {
    'Zac': { bg: 'bg-blue-600/20', text: 'text-blue-400' },
    'Luke': { bg: 'bg-green-600/20', text: 'text-green-400' },
    'Dillon': { bg: 'bg-purple-600/20', text: 'text-purple-400' },
  };

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: TrendingUp,
      color: 'text-brand-400',
      bgColor: 'bg-brand-500/20',
    },
    {
      label: 'Open Tasks',
      value: openTasks,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      label: 'Due Today',
      value: tasksDueToday,
      icon: Calendar,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Team Workload */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Team Workload (Open Tasks)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(workloadByAssignee).length > 0 ? (
            Object.entries(workloadByAssignee).map(([assignee, count]) => {
              const colors = assigneeColors[assignee] || { bg: 'bg-gray-600/20', text: 'text-gray-400' };
              return (
                <div
                  key={assignee}
                  className={`flex items-center justify-between p-3 rounded-lg ${colors.bg} border border-gray-700/30`}
                >
                  <span className="font-medium text-gray-200">{assignee}</span>
                  <span className={`text-xl font-bold ${colors.text}`}>{count}</span>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center text-gray-400 py-2">
              No open tasks assigned yet
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall Completion Rate</span>
            <span className="text-lg font-bold text-brand-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-green-500 h-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

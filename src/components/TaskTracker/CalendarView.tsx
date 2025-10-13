import { Calendar as BigCalendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

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

type CalendarViewProps = {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
};

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

export const CalendarView = ({ tasks, onTaskClick }: CalendarViewProps) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const events = useMemo(() => {
    return tasks
      .filter(task => task.dueDate)
      .map(task => {
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);

        // Set time to noon to avoid timezone issues
        dueDate.setHours(12, 0, 0, 0);

        const assigneeColors: Record<string, string> = {
          'Zac': '#3B82F6',
          'Luke': '#10B981',
          'Dillon': '#A855F7',
        };

        return {
          id: task.id,
          title: task.taskName || 'Untitled Task',
          start: dueDate,
          end: dueDate,
          resource: task,
          color: task.completed
            ? '#6B7280'
            : (task.assignee ? assigneeColors[task.assignee] : '#9CA3AF'),
        };
      });
  }, [tasks]);

  const eventStyleGetter = (event: any) => {
    const style = {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: event.resource.completed ? 0.6 : 1,
      color: 'white',
      border: 'none',
      display: 'block',
      fontSize: '12px',
      fontWeight: '500' as const,
      padding: '2px 4px',
    };
    return { style };
  };

  const CustomEvent = ({ event }: { event: any }) => {
    const task = event.resource as Task;
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        {task.completed && <span className="text-xs">✓</span>}
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
      <div style={{ height: '700px' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          onSelectEvent={(event: any) => {
            if (onTaskClick) {
              onTaskClick(event.resource);
            }
          }}
          popup
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          tooltipAccessor={(event: any) => {
            const task = event.resource as Task;
            return `${task.taskName}\n${task.assignee ? `Assigned to: ${task.assignee}` : 'Unassigned'}\n${task.description || ''}`;
          }}
        />
      </div>
    </div>
  );
};

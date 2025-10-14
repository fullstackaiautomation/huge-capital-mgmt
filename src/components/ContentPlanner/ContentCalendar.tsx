import { useState, useMemo } from 'react';
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
  type View,
  type Event,
  type ToolbarProps,
  type Components,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ContentPost, Person, Platform } from '../../types/content';
import { PERSON_COLORS } from '../../types/content';

interface ContentCalendarProps {
  posts: ContentPost[];
  onPostClick?: (post: ContentPost) => void;
  onDateClick?: (date: Date) => void;
  selectedPerson?: Person;
  selectedPlatform?: Platform;
}

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

// Custom toolbar component
const CustomToolbar: React.FC<ToolbarProps> = ({
  view,
  onNavigate,
  onView,
  label,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-brand-500/20 text-brand-500 rounded-lg hover:bg-brand-500/30 transition-colors font-medium"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-100 ml-4">{label}</h2>
      </div>

      <div className="flex items-center gap-2">
        {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map((viewName) => (
          <button
            key={viewName}
            onClick={() => onView(viewName)}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              view === viewName
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ContentCalendar = ({
  posts,
  onPostClick,
  onDateClick,
  selectedPerson,
  selectedPlatform,
}: ContentCalendarProps) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Convert posts to calendar events
  const events = useMemo(() => {
    return posts
      .filter(post => {
        if (selectedPerson && post.personName !== selectedPerson) return false;
        if (selectedPlatform && post.platform !== selectedPlatform) return false;
        return post.scheduledFor;
      })
      .map(post => {
        const eventDate = new Date(post.scheduledFor!);

        // Get platform icon
        const platformIcon = {
          LinkedIn: '💼',
          Twitter: '🐦',
          Facebook: '📘',
          Instagram: '📸',
          Blog: '📝',
          Newsletter: '📧',
          'ISO Newsletter': '📬',
          Skool: '🎓',
        }[post.platform] || '📄';

        return {
          id: post.id,
          title: `${platformIcon} ${post.personName}: ${
            post.isThread ? `Thread: ${post.threadHook}` : post.content.substring(0, 50)
          }${post.content.length > 50 ? '...' : ''}`,
          start: eventDate,
          end: eventDate,
          resource: post,
          color: PERSON_COLORS[post.personName],
        };
      });
  }, [posts, selectedPerson, selectedPlatform]);

  // Custom event style
  const eventStyleGetter = (event: any) => {
    const post = event.resource as ContentPost;
    const baseColor = PERSON_COLORS[post.personName];

    const style = {
      backgroundColor: post.status === 'published'
        ? '#10b981'
        : post.status === 'failed'
        ? '#ef4444'
        : baseColor,
      borderRadius: '6px',
      opacity: post.status === 'draft' ? 0.7 : 1,
      color: 'white',
      border: 'none',
      display: 'block',
      fontSize: '11px',
      padding: '2px 4px',
    };

    return { style };
  };

  // Custom event component
  const CustomEvent = ({ event }: { event: Event }) => {
    const post = (event as any).resource as ContentPost;
    const statusIcon = {
      published: '✓',
      scheduled: '⏰',
      draft: '✏️',
      failed: '❌',
    }[post.status];

    return (
      <div className="flex items-center gap-1 overflow-hidden p-1">
        <span className="text-xs">{statusIcon}</span>
        <span className="truncate text-xs">{event.title}</span>
      </div>
    );
  };

  // Custom date cell wrapper for adding new posts
  const CustomDateCellWrapper = ({ children, value }: { children?: React.ReactNode; value: Date }) => {
    return (
      <div className="relative h-full">
        {children}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDateClick) {
              onDateClick(value);
            }
          }}
          className="absolute top-1 right-1 p-1 opacity-0 hover:opacity-100 bg-brand-500/20 text-brand-500 rounded transition-opacity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-semibold text-gray-100">Content Calendar</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400">Draft</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Published</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-400">Failed</span>
            </div>
          </div>

          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ height: '700px' }} className="calendar-dark">
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
            toolbar: CustomToolbar as any,
            event: CustomEvent as any,
            dateCellWrapper: CustomDateCellWrapper as any,
          } as Components<Event, any>}
          onSelectEvent={(event: any) => {
            if (onPostClick) {
              onPostClick(event.resource);
            }
          }}
          popup
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          tooltipAccessor={(event: any) => {
            const post = event.resource as ContentPost;
            return `${post.platform} - ${post.personName}\n${
              post.isThread ? 'Thread: ' + post.threadHook : post.content
            }`;
          }}
        />
      </div>

      {/* Calendar CSS overrides */}
      <style>{`
        .calendar-dark .rbc-calendar {
          background: transparent;
          color: #e5e7eb;
        }

        .calendar-dark .rbc-month-view,
        .calendar-dark .rbc-time-view,
        .calendar-dark .rbc-agenda-view {
          background: rgba(17, 24, 39, 0.3);
          border: 1px solid rgba(55, 65, 81, 0.5);
          border-radius: 8px;
        }

        .calendar-dark .rbc-header {
          background: rgba(31, 41, 55, 0.5);
          color: #e5e7eb;
          font-weight: 600;
          padding: 8px;
          border-bottom: 1px solid rgba(55, 65, 81, 0.5);
        }

        .calendar-dark .rbc-header + .rbc-header {
          border-left: 1px solid rgba(55, 65, 81, 0.5);
        }

        .calendar-dark .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid rgba(55, 65, 81, 0.3);
        }

        .calendar-dark .rbc-month-row + .rbc-month-row {
          border-top: 1px solid rgba(55, 65, 81, 0.3);
        }

        .calendar-dark .rbc-today {
          background-color: rgba(247, 147, 30, 0.1);
        }

        .calendar-dark .rbc-off-range-bg {
          background: rgba(17, 24, 39, 0.5);
        }

        .calendar-dark .rbc-date-cell {
          padding: 4px;
          color: #9ca3af;
        }

        .calendar-dark .rbc-date-cell.rbc-now {
          color: #f7931e;
          font-weight: bold;
        }

        .calendar-dark .rbc-event {
          border: none !important;
        }

        .calendar-dark .rbc-event:focus {
          outline: 2px solid #f7931e;
          outline-offset: 1px;
        }

        .calendar-dark .rbc-selected {
          background-color: rgba(247, 147, 30, 0.2) !important;
        }

        .calendar-dark .rbc-toolbar button {
          color: inherit;
          background: transparent;
        }

        .calendar-dark .rbc-toolbar button:hover {
          background: rgba(55, 65, 81, 0.5);
        }

        .calendar-dark .rbc-toolbar button.rbc-active {
          background: #f7931e;
          color: white;
        }
      `}</style>
    </div>
  );
};
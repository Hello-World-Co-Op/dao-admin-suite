/**
 * EventList Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 3: Event list table with sorting, past event de-emphasis
 *
 * Renders a table of events sorted by start_time ascending.
 * Past events are visually de-emphasized with reduced opacity and "Ended" badge.
 *
 * @see AC2 - Event list sorted by start_time, past events de-emphasized
 * @see AC3 - Create event button (handled by parent)
 * @see AC4 - Edit event (onEdit callback)
 * @see AC5 - Delete event (onDelete callback)
 */

import { cn } from '@/utils/cn';
import type { EventItem } from '@/services/event-service';

interface EventListProps {
  events: EventItem[];
  loading: boolean;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onViewAttendees: (event: EventItem) => void;
}

export function EventList({
  events,
  loading,
  onEdit,
  onDelete,
  onViewAttendees,
}: EventListProps) {
  if (loading) {
    return (
      <div data-testid="table-loading-skeleton" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex space-x-4 px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-200 rounded w-36" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        data-testid="empty-state"
        className="text-center py-8 text-gray-500"
      >
        No events found. Create your first event.
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="event-table">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="px-4 py-3 text-sm font-semibold text-gray-700">
              Title
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700">
              Start Time
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700">
              Location
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700">
              Type
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700">
              Attendees
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isPast = new Date(event.start_time) < now;

            return (
              <tr
                key={event.id}
                className={cn(
                  'border-b border-gray-100 hover:bg-gray-50',
                  isPast && 'opacity-60',
                )}
                data-testid={`event-row-${event.id}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {event.title}
                  {isPast && (
                    <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-1">
                      Ended
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div>
                    {new Date(event.start_time).toLocaleString()}
                  </div>
                  {event.timezone !== 'UTC' && (
                    <div className="text-xs text-gray-400">
                      {event.timezone}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {event.location || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {event.is_recurring ? (
                    <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      Recurring
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      One-time
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {event.attendee_count}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(event)}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                      data-testid={`edit-btn-${event.id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(event)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      data-testid={`delete-btn-${event.id}`}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewAttendees(event)}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                      data-testid={`attendees-btn-${event.id}`}
                    >
                      Attendees
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

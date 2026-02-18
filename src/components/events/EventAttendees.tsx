/**
 * EventAttendees Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 5: Attendee panel with RSVP status badges
 *
 * Shows attendee list with user_id and status badges.
 * Fetches event detail on open (lazy fetch pattern).
 *
 * @see AC8 - Attendee panel shows RSVP list
 */

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { EventItem, EventDetail } from '@/services/event-service';
import { getEventDetail } from '@/services/event-service';

interface EventAttendeesProps {
  event: EventItem | null;
  onClose: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  going: 'bg-green-100 text-green-800',
  maybe: 'bg-yellow-100 text-yellow-800',
  not_going: 'bg-gray-100 text-gray-600',
};

export function EventAttendees({ event, onClose }: EventAttendeesProps) {
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setLoading(true);
      setError(null);
      setDetail(null);
      getEventDetail(event.id)
        .then(setDetail)
        .catch((e) =>
          setError(e instanceof Error ? e.message : 'Failed to load attendees'),
        )
        .finally(() => setLoading(false));
    }
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event) return null;

  const attendees = detail?.attendees ?? [];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="attendees-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendees for &apos;{event.title}&apos; ({event.attendee_count}{' '}
            going)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            data-testid="attendees-close-btn"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p
              className="text-gray-500 text-sm"
              data-testid="attendees-loading"
            >
              Loading attendees...
            </p>
          )}

          {error && (
            <p className="text-red-600 text-sm" data-testid="attendees-error">
              {error}
            </p>
          )}

          {!loading && !error && attendees.length === 0 && (
            <p
              className="text-gray-500 text-sm"
              data-testid="attendees-empty"
            >
              No RSVPs yet.
            </p>
          )}

          {!loading && !error && attendees.length > 0 && (
            <table className="w-full" data-testid="attendees-table">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                    User
                  </th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee) => (
                  <tr
                    key={attendee.user_id}
                    className="border-b border-gray-100"
                  >
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {attendee.user_id.length > 12
                        ? `${attendee.user_id.slice(0, 12)}...`
                        : attendee.user_id}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          STATUS_BADGES[attendee.status] ??
                            'bg-gray-100 text-gray-600',
                        )}
                      >
                        {attendee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

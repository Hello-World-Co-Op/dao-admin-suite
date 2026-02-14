/**
 * ScheduleModal Component
 *
 * Modal with datetime picker for scheduling a blog post.
 * Validates that the selected date is in the future.
 *
 * @see BL-008.3.5 Task 9 - Schedule action with date picker
 * @see AC5 - Schedule post action
 */

import { useState, useCallback } from 'react';

interface ScheduleModalProps {
  visible: boolean;
  onSchedule: (scheduledAt: string) => void;
  onCancel: () => void;
}

export function ScheduleModal({ visible, onSchedule, onCancel }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = useCallback(() => {
    if (!dateTime) {
      setError('Please select a date and time');
      return;
    }

    const selectedDate = new Date(dateTime);
    if (selectedDate <= new Date()) {
      setError('Schedule time must be in the future');
      return;
    }

    setError(null);
    onSchedule(dateTime);
  }, [dateTime, onSchedule]);

  if (!visible) return null;

  // Minimum datetime: current time (rounded to next minute)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1, 0, 0);
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="schedule-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 id="schedule-modal-title" className="text-lg font-semibold text-gray-900 mb-4">
          Schedule Post
        </h2>
        <div className="mb-4">
          <label htmlFor="schedule-datetime" className="block text-sm font-medium text-gray-700 mb-1">
            Publication Date & Time
          </label>
          <input
            id="schedule-datetime"
            type="datetime-local"
            value={dateTime}
            min={minDateTime}
            onChange={(e) => {
              setDateTime(e.target.value);
              setError(null);
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            data-testid="schedule-datetime-input"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600" data-testid="schedule-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            data-testid="schedule-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            data-testid="schedule-confirm"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

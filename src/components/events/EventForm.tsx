/**
 * EventForm Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 2: Create/edit form for events with validation
 *
 * Supports both create mode (no initialValues) and edit mode (initialValues provided).
 * Includes client-side validation, recurring event toggle, timezone selector,
 * and inline error messages.
 *
 * @see AC3 - Create event via EventForm modal
 * @see AC4 - Edit event via EventForm pre-populated
 * @see AC6 - Recurring toggle shows/hides RRULE field
 * @see AC7 - Timezone selector with 8+ IANA timezones
 * @see AC9 - Form validation with inline errors
 */

import { useState, type FormEvent } from 'react';
import type { EventItem, CreateEventPayload } from '@/services/event-service';
import { validateRrule, type ValidateRruleResponse } from '@/services/event-service';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Greenwich Mean Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  {
    value: 'America/Los_Angeles',
    label: 'America/Los_Angeles (Pacific Time)',
  },
  { value: 'Europe/London', label: 'Europe/London (British Time)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central European Time)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time)' },
] as const;

interface EventFormProps {
  initialValues?: EventItem;
  onSubmit: (payload: CreateEventPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  formError?: string | null;
}

function splitIsoDate(isoString: string): { date: string; time: string } {
  const dt = new Date(isoString);
  const dateStr = dt.toISOString().split('T')[0];
  const timeStr = dt.toISOString().split('T')[1].slice(0, 5);
  return { date: dateStr, time: timeStr };
}

export function EventForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  formError,
}: EventFormProps) {
  const isEditMode = !!initialValues;

  // Initialize form state
  const startInit = initialValues
    ? splitIsoDate(initialValues.start_time)
    : { date: '', time: '' };
  const endInit = initialValues
    ? splitIsoDate(initialValues.end_time)
    : { date: '', time: '' };

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [locationUrl, setLocationUrl] = useState(
    initialValues?.location_url ?? '',
  );
  const [startDate, setStartDate] = useState(startInit.date);
  const [startTime, setStartTime] = useState(startInit.time);
  const [endDate, setEndDate] = useState(endInit.date);
  const [endTime, setEndTime] = useState(endInit.time);
  const [timezone, setTimezone] = useState(
    initialValues?.timezone ?? 'UTC',
  );
  const [isRecurring, setIsRecurring] = useState(
    initialValues?.is_recurring ?? false,
  );
  const [recurrenceRule, setRecurrenceRule] = useState(
    initialValues?.recurrence_rule ?? '',
  );
  const [isPublic, setIsPublic] = useState(
    initialValues?.is_public ?? true,
  );
  const [maxAttendees, setMaxAttendees] = useState(
    initialValues?.max_attendees != null
      ? String(initialValues.max_attendees)
      : '',
  );

  // RRULE preview state (AI-R118)
  const [rrulePreview, setRrulePreview] = useState<ValidateRruleResponse | null>(null);
  const [rrulePreviewLoading, setRrulePreviewLoading] = useState(false);
  const [rrulePreviewError, setRrulePreviewError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearFieldError(fieldName: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }

  async function handlePreviewRrule() {
    if (!recurrenceRule.trim()) return;
    setRrulePreviewLoading(true);
    setRrulePreviewError(null);
    setRrulePreview(null);
    try {
      const dtstart = startDate && startTime
        ? `${startDate}T${startTime}:00`
        : new Date().toISOString();
      const result = await validateRrule(recurrenceRule.trim(), dtstart, 5);
      if (!result.valid) {
        setRrulePreviewError(result.error || 'Invalid RRULE');
      } else {
        setRrulePreview(result);
      }
    } catch (err) {
      setRrulePreviewError(
        err instanceof Error ? err.message : 'Failed to validate RRULE',
      );
    } finally {
      setRrulePreviewLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Required field checks
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!startDate || !startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!endDate || !endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (!timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    // Cross-field validation: end must be after start
    if (startDate && startTime && endDate && endTime) {
      const startIso = `${startDate}T${startTime}:00`;
      const endIso = `${endDate}T${endTime}:00`;
      if (new Date(endIso) <= new Date(startIso)) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    // Recurring check
    if (isRecurring && !recurrenceRule.trim()) {
      newErrors.recurrenceRule =
        'Recurrence rule is required for recurring events';
    }

    // URL check
    if (locationUrl.trim() && !locationUrl.trim().startsWith('https://')) {
      newErrors.locationUrl = 'Location URL must start with https://';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build payload
    const payload: CreateEventPayload = {
      title: title.trim(),
      start_time: `${startDate}T${startTime}:00`,
      end_time: `${endDate}T${endTime}:00`,
      timezone,
    };

    if (description.trim()) payload.description = description.trim();
    if (location.trim()) payload.location = location.trim();
    if (locationUrl.trim()) payload.location_url = locationUrl.trim();
    // Always include is_recurring in payload so edits can clear recurring status
    payload.is_recurring = isRecurring;
    if (isRecurring) {
      payload.recurrence_rule = recurrenceRule.trim();
    } else {
      // Explicitly clear recurrence_rule when recurring is turned off (required for edit mode)
      payload.recurrence_rule = undefined;
    }
    payload.is_public = isPublic;
    if (maxAttendees.trim()) {
      payload.max_attendees = parseInt(maxAttendees, 10);
    }

    await onSubmit(payload);
  }

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} data-testid="event-form">
      {formError && (
        <p className="text-sm text-red-600 mb-3" data-testid="form-error">
          {formError}
        </p>
      )}

      {/* Title */}
      <div className="mb-4">
        <label htmlFor="event-title" className={labelClass}>
          Title *
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearFieldError('title');
          }}
          maxLength={200}
          className={inputClass}
          data-testid="event-title-input"
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label htmlFor="event-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputClass}
          data-testid="event-description-input"
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <label htmlFor="event-location" className={labelClass}>
          Location
        </label>
        <input
          id="event-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Physical address or 'Virtual'"
          className={inputClass}
          data-testid="event-location-input"
        />
      </div>

      {/* Location URL */}
      <div className="mb-4">
        <label htmlFor="event-location-url" className={labelClass}>
          Location URL
        </label>
        <input
          id="event-location-url"
          type="url"
          value={locationUrl}
          onChange={(e) => {
            setLocationUrl(e.target.value);
            clearFieldError('locationUrl');
          }}
          placeholder="https://zoom.us/j/..."
          className={inputClass}
          data-testid="event-location-url-input"
        />
        {errors.locationUrl && (
          <p className="text-sm text-red-600 mt-1">{errors.locationUrl}</p>
        )}
      </div>

      {/* Start Date + Time */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-start-date" className={labelClass}>
            Start Date *
          </label>
          <input
            id="event-start-date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              clearFieldError('startTime');
            }}
            className={inputClass}
            data-testid="event-start-date-input"
          />
        </div>
        <div>
          <label htmlFor="event-start-time" className={labelClass}>
            Start Time *
          </label>
          <input
            id="event-start-time"
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              clearFieldError('startTime');
            }}
            className={inputClass}
            data-testid="event-start-time-input"
          />
        </div>
        {errors.startTime && (
          <p className="text-sm text-red-600 mt-1 col-span-2">
            {errors.startTime}
          </p>
        )}
      </div>

      {/* End Date + Time */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-end-date" className={labelClass}>
            End Date *
          </label>
          <input
            id="event-end-date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              clearFieldError('endTime');
            }}
            className={inputClass}
            data-testid="event-end-date-input"
          />
        </div>
        <div>
          <label htmlFor="event-end-time" className={labelClass}>
            End Time *
          </label>
          <input
            id="event-end-time"
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              clearFieldError('endTime');
            }}
            className={inputClass}
            data-testid="event-end-time-input"
          />
        </div>
        {errors.endTime && (
          <p className="text-sm text-red-600 mt-1 col-span-2">
            {errors.endTime}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div className="mb-4">
        <label htmlFor="event-timezone" className={labelClass}>
          Timezone *
        </label>
        <select
          id="event-timezone"
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            clearFieldError('timezone');
          }}
          className={inputClass}
          data-testid="event-timezone-select"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-sm text-red-600 mt-1">{errors.timezone}</p>
        )}
      </div>

      {/* Is Recurring */}
      <div className="mb-4 flex items-center gap-2">
        <input
          id="event-is-recurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => {
            setIsRecurring(e.target.checked);
            if (!e.target.checked) {
              setRecurrenceRule('');
              clearFieldError('recurrenceRule');
              setRrulePreview(null);
              setRrulePreviewError(null);
            }
          }}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          data-testid="event-is-recurring-checkbox"
        />
        <label htmlFor="event-is-recurring" className="text-sm font-medium text-gray-700">
          Is Recurring
        </label>
      </div>

      {/* Recurrence Rule (shown only when is_recurring is true) */}
      {isRecurring && (
        <div className="mb-4">
          <label htmlFor="event-recurrence-rule" className={labelClass}>
            Recurrence Rule
          </label>
          <input
            id="event-recurrence-rule"
            type="text"
            value={recurrenceRule}
            onChange={(e) => {
              setRecurrenceRule(e.target.value);
              clearFieldError('recurrenceRule');
              setRrulePreview(null);
              setRrulePreviewError(null);
            }}
            placeholder="FREQ=WEEKLY;BYDAY=TU"
            className={inputClass}
            data-testid="event-recurrence-rule-input"
          />
          {errors.recurrenceRule && (
            <p className="text-sm text-red-600 mt-1">
              {errors.recurrenceRule}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1" data-testid="rrule-helper-text">
            RFC 5545 RRULE format. Examples: <code>FREQ=WEEKLY;BYDAY=TU</code>{' '}
            (weekly Tuesdays), <code>FREQ=MONTHLY;BYDAY=1MO</code> (first
            Monday monthly), <code>FREQ=DAILY;COUNT=5</code> (5 times).
          </p>
          {/* AI-R118: RRULE Preview */}
          <button
            type="button"
            onClick={handlePreviewRrule}
            disabled={rrulePreviewLoading || !recurrenceRule.trim()}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="rrule-preview-btn"
          >
            {rrulePreviewLoading ? 'Validating...' : 'Preview recurrence'}
          </button>
          {rrulePreviewError && (
            <p className="text-sm text-red-600 mt-1" data-testid="rrule-preview-error">
              {rrulePreviewError}
            </p>
          )}
          {rrulePreview && rrulePreview.valid && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md" data-testid="rrule-preview-dates">
              <p className="text-xs font-medium text-blue-800 mb-1">Next 5 occurrences:</p>
              <ul className="text-xs text-blue-700 space-y-0.5">
                {rrulePreview.next_occurrences.map((dateStr, i) => (
                  <li key={i}>{new Date(dateStr).toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Public Event */}
      <div className="mb-4 flex items-center gap-2">
        <input
          id="event-is-public"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          data-testid="event-is-public-checkbox"
        />
        <label htmlFor="event-is-public" className="text-sm font-medium text-gray-700">
          Public Event
        </label>
      </div>

      {/* Max Attendees */}
      <div className="mb-6">
        <label htmlFor="event-max-attendees" className={labelClass}>
          Max Attendees
        </label>
        <input
          id="event-max-attendees"
          type="number"
          min="1"
          value={maxAttendees}
          onChange={(e) => setMaxAttendees(e.target.value)}
          placeholder="Unlimited"
          className={inputClass}
          data-testid="event-max-attendees-input"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          data-testid="event-cancel-btn"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          data-testid="event-submit-btn"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              data-testid="submit-spinner"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}

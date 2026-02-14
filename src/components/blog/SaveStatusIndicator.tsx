/**
 * SaveStatusIndicator - Displays auto-save status with ARIA announcements
 *
 * States:
 * - idle: No indicator shown
 * - saving: Spinner + "Saving..."
 * - saved: Checkmark + "Last saved: [timestamp]" (server-confirmed, NOT optimistic)
 * - error: Red "Save failed" + retry button
 *
 * NFR27: Status changes announced via aria-live="polite" region.
 *
 * @see BL-008.3.4 AC3, AC5
 */

import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  message?: string;
  onRetry?: () => void;
}

export function SaveStatusIndicator({ status, message, onRetry }: SaveStatusIndicatorProps) {
  if (status === 'idle') {
    return (
      <div aria-live="polite" data-testid="save-status" className="h-6" />
    );
  }

  return (
    <div
      aria-live="polite"
      data-testid="save-status"
      className="flex items-center gap-2 text-sm h-6"
    >
      {status === 'saving' && (
        <>
          <div
            className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
            data-testid="save-spinner"
            role="status"
            aria-label="Saving"
          />
          <span className="text-gray-500">Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            data-testid="save-checkmark"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600" data-testid="save-timestamp">
            Last saved: {message}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600">Save failed</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-red-600 underline hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
              data-testid="save-retry-button"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}

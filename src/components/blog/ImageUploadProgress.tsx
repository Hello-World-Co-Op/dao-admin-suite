/**
 * Image Upload Progress Component
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 * Task 3.3: Display aggregate progress indicator
 *
 * Features:
 * - Shows aggregate progress: "Uploading 2 of 5 images..."
 * - Individual progress bars per upload task
 * - Retry buttons for failed uploads
 * - ARIA live region for screen reader announcements
 * - Collapsible detail view
 *
 * @see AC2 - Sequential upload with aggregate progress
 * @see AC5 - Retry button on failed uploads
 */

import type { UploadTask } from '@/hooks/useImageUpload';

interface ImageUploadProgressProps {
  /** Current upload queue */
  queue: UploadTask[];
  /** Status message for ARIA live region */
  statusMessage: string;
  /** Handler to retry a failed upload */
  onRetry: (taskId: string) => void;
  /** Handler to remove a task from the queue */
  onRemove: (taskId: string) => void;
  /** Handler to clear all completed tasks */
  onClearCompleted: () => void;
}

/** Status icon for each upload task */
function StatusIcon({ status }: { status: UploadTask['status'] }) {
  switch (status) {
    case 'pending':
      return (
        <span className="text-gray-400" aria-hidden="true" data-testid="status-pending">
          ...
        </span>
      );
    case 'compressing':
      return (
        <span
          className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block"
          aria-hidden="true"
          data-testid="status-compressing"
        />
      );
    case 'uploading':
      return (
        <span
          className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block"
          aria-hidden="true"
          data-testid="status-uploading"
        />
      );
    case 'success':
      return (
        <svg
          className="h-4 w-4 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          data-testid="status-success"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'failed':
      return (
        <svg
          className="h-4 w-4 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          data-testid="status-failed"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    default:
      return null;
  }
}

export function ImageUploadProgress({
  queue,
  statusMessage,
  onRetry,
  onRemove,
  onClearCompleted,
}: ImageUploadProgressProps) {
  if (queue.length === 0) return null;

  const completedCount = queue.filter((t) => t.status === 'success').length;
  const failedCount = queue.filter((t) => t.status === 'failed').length;
  const hasCompleted = completedCount > 0;

  return (
    <div
      className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden"
      data-testid="image-upload-progress"
    >
      {/* ARIA Live Region for status announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="upload-status-live">
        {statusMessage}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700" data-testid="upload-progress-header">
          {completedCount === queue.length
            ? `All ${queue.length} images uploaded`
            : `Uploading images (${completedCount}/${queue.length})`}
        </span>
        {hasCompleted && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="text-xs text-gray-500 hover:text-gray-700 underline focus:outline-none"
            data-testid="clear-completed-button"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
        {queue.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-3 py-2"
            data-testid={`upload-task-${task.id}`}
          >
            <StatusIcon status={task.status} />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{task.file.name}</p>

              {/* Progress bar */}
              {(task.status === 'uploading' || task.status === 'compressing') && (
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${task.status === 'compressing' ? 0 : task.progress}%` }}
                    role="progressbar"
                    aria-valuenow={task.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Upload progress for ${task.file.name}`}
                    data-testid={`progress-bar-${task.id}`}
                  />
                </div>
              )}

              {/* Error message */}
              {task.status === 'failed' && task.error && (
                <p className="text-xs text-red-600 mt-0.5" data-testid={`error-message-${task.id}`}>
                  {task.error}
                </p>
              )}
            </div>

            {/* Action buttons */}
            {task.status === 'failed' && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onRetry(task.id)}
                  className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`Retry upload for ${task.file.name}`}
                  data-testid={`retry-button-${task.id}`}
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(task.id)}
                  className="px-2 py-1 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  aria-label={`Remove ${task.file.name} from queue`}
                  data-testid={`remove-button-${task.id}`}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with failed count */}
      {failedCount > 0 && (
        <div
          className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600"
          data-testid="failed-count"
        >
          {failedCount} upload{failedCount > 1 ? 's' : ''} failed. Click retry to try again.
        </div>
      )}
    </div>
  );
}

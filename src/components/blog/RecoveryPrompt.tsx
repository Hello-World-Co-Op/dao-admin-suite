/**
 * RecoveryPrompt - Crash recovery prompt for unsaved changes
 *
 * Shown when localStorage has a newer backup than the canister's updated_at
 * (difference > 5 seconds after normalization).
 *
 * @see BL-008.3.4 AC6, AC7
 */

interface RecoveryPromptProps {
  visible: boolean;
  onRecover: () => void;
  onDiscard: () => void;
}

export function RecoveryPrompt({ visible, onRecover, onDiscard }: RecoveryPromptProps) {
  if (!visible) return null;

  return (
    <div
      className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg"
      role="alert"
      data-testid="recovery-prompt"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            Recover unsaved changes?
          </p>
          <p className="text-sm text-blue-700 mt-1">
            A newer version of this post was found in your browser. Would you like to recover it?
          </p>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={onRecover}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              data-testid="recovery-recover-button"
            >
              Recover
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              data-testid="recovery-discard-button"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

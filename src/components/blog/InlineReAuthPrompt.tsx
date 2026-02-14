/**
 * InlineReAuthPrompt - Non-modal re-authentication prompt
 *
 * Shown when an auto-save or manual save fails with Unauthorized (401/403).
 * Stays inline below the editor toolbar - NEVER redirects to /login.
 * Editor content is preserved during re-auth flow.
 *
 * @see BL-008.3.4 AC8
 */

interface InlineReAuthPromptProps {
  visible: boolean;
  onReAuth: () => void;
  onDismiss: () => void;
}

export function InlineReAuthPrompt({ visible, onReAuth, onDismiss }: InlineReAuthPromptProps) {
  if (!visible) return null;

  return (
    <div
      className="mb-4 p-4 bg-orange-50 border border-orange-300 rounded-lg"
      role="alert"
      data-testid="reauth-prompt"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">
            Your session has expired
          </p>
          <p className="text-sm text-orange-700 mt-1">
            Your content is safe. Please re-authenticate to continue saving.
          </p>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={onReAuth}
              className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              data-testid="reauth-button"
            >
              Re-authenticate
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm font-medium text-orange-700 bg-white border border-orange-300 rounded hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              data-testid="reauth-dismiss-button"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

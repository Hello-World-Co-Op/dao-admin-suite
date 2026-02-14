/**
 * PersistentBanner - Conflict notification banner for StaleEdit errors
 *
 * Shown when the canister returns StaleEdit during auto-save,
 * indicating the post was modified in another session.
 *
 * The banner persists until the user reloads the page.
 * Auto-save timers are stopped when this banner is visible.
 *
 * @see BL-008.3.4 AC4
 */

interface PersistentBannerProps {
  message: string;
  visible: boolean;
}

export function PersistentBanner({ message, visible }: PersistentBannerProps) {
  if (!visible) return null;

  return (
    <div
      className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center justify-between"
      role="alert"
      data-testid="persistent-banner"
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-yellow-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="text-sm text-yellow-800">{message}</span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-sm text-yellow-800 underline hover:text-yellow-900 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded"
        data-testid="persistent-banner-reload"
      >
        Reload
      </button>
    </div>
  );
}

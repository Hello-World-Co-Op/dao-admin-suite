/**
 * Blog Rebuild Client - Trigger and query marketing-suite rebuilds
 *
 * Story BL-008.6.3: Admin Rebuild Trigger and Pipeline Integration
 * Task 2.4: Extract triggerRebuild() as a standalone utility
 *
 * Provides:
 * - triggerRebuild(): Fire-and-forget POST to rebuild webhook
 * - fetchRebuildStatus(): Query last rebuild timestamp
 *
 * @see AC1 - POST to /api/webhooks/blog-rebuild via oracle-bridge with SSO session
 * @see AC2 - Auto-trigger rebuild on publish/archive/update-published
 * @see AC3 - Display last rebuild timestamp
 */

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

/**
 * Trigger a marketing-suite rebuild via the oracle-bridge webhook.
 *
 * Fire-and-forget pattern:
 * - Does NOT await the response
 * - Does NOT show errors to the user
 * - Logs to console for debugging only
 *
 * The webhook has a 5-minute debounce, so rapid triggers are safe.
 *
 * @see Task 2.5 - Silent fire-and-forget pattern
 * @see Task 2.6 - Log rebuild trigger to console
 */
export function triggerRebuild(): void {
  const oracleBridgeUrl = getOracleBridgeUrl();

  console.debug('[BlogRebuild] Triggering rebuild...');

  fetch(`${oracleBridgeUrl}/api/webhooks/blog-rebuild`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => {
    if (response.ok || response.status === 202) {
      console.debug('[BlogRebuild] Rebuild queued successfully');
    } else {
      console.debug(`[BlogRebuild] Trigger returned ${response.status} (non-critical)`);
    }
  }).catch((err) => {
    // Silent failure OK - rebuild is best-effort
    console.debug('[BlogRebuild] Trigger failed (non-critical):', err);
  });
}

/**
 * Rebuild status response from oracle-bridge.
 */
export interface RebuildStatus {
  /** ISO 8601 timestamp of last successful rebuild, or null if never rebuilt */
  last_rebuild_at: string | null;
  /** Whether a rebuild is currently pending (debounce timer active) */
  pending: boolean;
}

/**
 * Fetch the current rebuild status from oracle-bridge.
 *
 * @returns RebuildStatus with lastRebuildAt and pending flag
 * @throws Error if fetch fails or returns non-200
 *
 * @see Task 1.5 - Rebuild status section
 * @see Task 1.8 - Poll every 30 seconds
 */
export async function fetchRebuildStatus(): Promise<RebuildStatus> {
  const oracleBridgeUrl = getOracleBridgeUrl();

  const response = await fetch(`${oracleBridgeUrl}/api/webhooks/blog-rebuild/status`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch rebuild status: ${response.status}`);
  }

  return response.json();
}

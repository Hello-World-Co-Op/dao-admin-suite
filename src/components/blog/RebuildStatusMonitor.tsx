/**
 * RebuildStatusMonitor Component
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 1: Create rebuild status monitoring component
 *
 * Displays the last rebuild timestamp with staleness-based status indicator:
 * - Green: < 30 minutes (fresh)
 * - Amber: 30 min - 24 hours (stale)
 * - Red: > 24 hours (critical)
 *
 * Provides a manual "Rebuild Now" button with loading state and toast confirmation.
 *
 * @see AC1 - Rebuild status section with timestamp and status indicator
 * @see FR52 - Last successful rebuild timestamp and status
 * @see FR53 - Staleness warnings (amber > 30 min, red > 24 hours)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchRebuildStatus, type RebuildStatus } from '@/services/blog-rebuild-client';

type StalenessLevel = 'fresh' | 'stale' | 'critical' | 'unknown';

/**
 * Calculate staleness level based on time since last rebuild.
 */
function calculateStaleness(lastRebuildAt: string | null): StalenessLevel {
  if (!lastRebuildAt) return 'unknown';

  const now = Date.now();
  const lastRebuild = new Date(lastRebuildAt).getTime();
  const diffMs = now - lastRebuild;
  const diffMinutes = diffMs / (1000 * 60);

  if (diffMinutes < 30) return 'fresh';        // Green
  if (diffMinutes < 24 * 60) return 'stale';   // Amber (30 min - 24 hours)
  return 'critical';                             // Red (> 24 hours)
}

/**
 * Format a timestamp as relative time using Intl.RelativeTimeFormat.
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return rtf.format(-minutes, 'minute');
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return rtf.format(-hours, 'hour');
  }

  const days = Math.floor(hours / 24);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  return rtf.format(-days, 'day');
}

const STALENESS_STYLES: Record<StalenessLevel, { bg: string; text: string; label: string }> = {
  fresh: { bg: 'bg-green-100', text: 'text-green-800', label: 'Healthy' },
  stale: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Stale' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
  unknown: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' },
};

export default function RebuildStatusMonitor() {
  const [status, setStatus] = useState<RebuildStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const oracleBridgeUrl = useMemo(() => import.meta.env.VITE_ORACLE_BRIDGE_URL || '', []);

  const loadStatus = useCallback(async () => {
    try {
      const result = await fetchRebuildStatus();
      setStatus(result);
      setError(null);
    } catch {
      setError('Failed to fetch rebuild status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRebuild = useCallback(async () => {
    if (rebuilding) return;
    setRebuilding(true);

    try {
      const response = await fetch(`${oracleBridgeUrl}/api/webhooks/blog-rebuild`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok || response.status === 202) {
        setToast({ visible: true, message: 'Rebuild triggered successfully', type: 'success' });
        // Refetch status after triggering rebuild
        setTimeout(() => loadStatus(), 2000);
      } else {
        setToast({ visible: true, message: 'Failed to trigger rebuild', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Failed to trigger rebuild', type: 'error' });
    } finally {
      setRebuilding(false);
      setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
    }
  }, [oracleBridgeUrl, rebuilding, loadStatus]);

  const staleness = status ? calculateStaleness(status.last_rebuild_at) : 'unknown';
  const styles = STALENESS_STYLES[staleness];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="rebuild-status-monitor">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="rebuild-status-monitor">
        <p className="text-red-600 text-sm" data-testid="rebuild-status-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="rebuild-status-monitor">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rebuild Status</h3>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
              data-testid="staleness-badge"
            >
              {styles.label}
            </span>
            <p className="text-sm text-gray-600" data-testid="rebuild-timestamp">
              {status?.last_rebuild_at
                ? `Last rebuilt: ${formatRelativeTime(status.last_rebuild_at)}`
                : 'Last rebuilt: Never'}
            </p>
          </div>
          {status?.pending && (
            <p className="text-sm text-blue-600 mt-1" data-testid="rebuild-pending">
              Rebuild pending...
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleRebuild}
          disabled={rebuilding}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            rebuilding
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          data-testid="rebuild-now-button"
        >
          <svg className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {rebuilding ? 'Rebuilding...' : 'Rebuild Now'}
        </button>
      </div>

      {/* Toast notification */}
      {toast.visible && (
        <div
          className={`mt-4 px-4 py-2 rounded-lg text-sm ${
            toast.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
          role="status"
          data-testid="rebuild-toast"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

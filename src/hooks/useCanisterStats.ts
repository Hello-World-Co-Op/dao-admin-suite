/**
 * useCanisterStats Hook
 *
 * Queries the blog canister for operational health statistics.
 * Auto-refreshes every 30 seconds or on manual refresh button click.
 *
 * @see BL-008.7.3 Task 4 - Canister health stats display
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CanisterStats {
  total_posts: number;
  published_count: number;
  draft_count: number;
  scheduled_count: number;
  archived_count: number;
  storage_usage_bytes: number;
}

const DEFAULT_STATS: CanisterStats = {
  total_posts: 0,
  published_count: 0,
  draft_count: 0,
  scheduled_count: 0,
  archived_count: 0,
  storage_usage_bytes: 0,
};

/** Auto-refresh interval: 30 seconds */
const REFRESH_INTERVAL = 30_000;

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

export function useCanisterStats() {
  const [stats, setStats] = useState<CanisterStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const oracleBridgeUrl = getOracleBridgeUrl();
      const response = await fetch(`${oracleBridgeUrl}/api/blog/canister-stats`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch canister stats: ${response.status}`);
      }

      const data: CanisterStats = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('[useCanisterStats] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch canister stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchStats();

    intervalRef.current = window.setInterval(fetchStats, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh };
}

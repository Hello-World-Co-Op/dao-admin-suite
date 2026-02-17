/**
 * RoleAuditLog Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 6: Audit log table with 30-second polling when active
 *
 * Shows role change history with timestamps, action type, role, user,
 * and who performed the action. Polls every 30 seconds when tab is active.
 *
 * @see AC9 - Audit log tab with auto-refresh every 30 seconds
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuditLog } from '@/services/roles-client';
import type { AuditEntry } from '@/services/roles-client';

interface RoleAuditLogProps {
  active: boolean;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSeconds = Math.round((now - date) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function RoleAuditLog({ active }: RoleAuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async (fetchLimit?: number) => {
    try {
      const result = await getAuditLog(fetchLimit ?? limit);
      setEntries(result.entries);
      setTotal(result.total);
      setError(null);
    } catch {
      setError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Polling when active (AC9: auto-refresh every 30 seconds).
  // fetchAuditLog is included in deps so polling restarts when limit changes
  // (e.g., after Load More), ensuring the interval always uses the current limit.
  useEffect(() => {
    if (!active) return;

    setLoading(true);
    fetchAuditLog();

    const interval = setInterval(() => {
      fetchAuditLog();
    }, 30_000);

    return () => clearInterval(interval);
  }, [active, fetchAuditLog]);

  const handleLoadMore = useCallback(() => {
    const newLimit = limit + 50;
    setLimit(newLimit);
    fetchAuditLog(newLimit);
  }, [limit, fetchAuditLog]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAuditLog();
  }, [fetchAuditLog]);

  if (loading && entries.length === 0) {
    return (
      <div data-testid="audit-loading-skeleton" className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center" data-testid="audit-error">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
          data-testid="audit-retry-btn"
        >
          Retry
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500" data-testid="audit-empty">
        No audit entries yet
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="audit-log-table">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performed By
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const role = (entry.details as { role?: string })?.role ?? entry.user_role;
              const performedBy = (entry.details as { performed_by?: string })?.performed_by ?? entry.user_role;
              const truncatedRecordId = entry.record_id.length > 8
                ? `${entry.record_id.slice(0, 8)}...`
                : entry.record_id;
              const truncatedPerformedBy = performedBy.length > 8
                ? `${performedBy.slice(0, 8)}...`
                : performedBy;

              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600" title={entry.created_at}>
                    {getRelativeTime(entry.created_at)}
                  </td>
                  <td className="px-4 py-3" data-testid="audit-action-badge">
                    {entry.action === 'ROLE_ASSIGNED' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {role}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {truncatedRecordId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {truncatedPerformedBy}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > entries.length && (
        <div className="p-4 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
            data-testid="load-more-btn"
          >
            Load More ({total - entries.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

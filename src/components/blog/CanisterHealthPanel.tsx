/**
 * CanisterHealthPanel Component
 *
 * Displays blog canister operational health statistics:
 * - Total posts, published, drafts, scheduled, archived counts
 * - Storage usage with color indicators (green <50MB, yellow 50-75MB, red >75MB)
 * - Link to GitHub Actions workflow run history
 * - Auto-refreshes every 30 seconds
 *
 * @see BL-008.7.3 Task 4 - Canister health stats display
 * @see AC#3 - Admin dashboard shows canister health
 * @see NFR33 - Canister storage target
 */

import { useCanisterStats } from '@/hooks/useCanisterStats';

/**
 * Format bytes to human-readable MB with 2 decimal places
 */
function formatStorageMB(bytes: number): string {
  return (bytes / 1_000_000).toFixed(2);
}

/**
 * Get color class for storage indicator based on NFR33 thresholds
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getStorageColor(bytes: number): 'green' | 'yellow' | 'red' {
  if (bytes > 75_000_000) return 'red';
  if (bytes > 50_000_000) return 'yellow';
  return 'green';
}

/**
 * Get CSS classes for storage badge
 */
function getStorageClasses(color: 'green' | 'yellow' | 'red'): string {
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800';
    case 'red':
      return 'bg-red-100 text-red-800';
  }
}

interface StatItemProps {
  label: string;
  value: string | number;
  colorClass?: string;
}

function StatItem({ label, value, colorClass }: StatItemProps) {
  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span
        className={`text-lg font-semibold ${colorClass || 'text-gray-900'}`}
        data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CanisterHealthPanel() {
  const { stats, loading, error, refresh } = useCanisterStats();

  const storageColor = getStorageColor(stats.storage_usage_bytes);
  const storageMB = formatStorageMB(stats.storage_usage_bytes);
  const storageClasses = getStorageClasses(storageColor);

  if (error) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-6"
        data-testid="canister-health-panel"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Blog Canister Health</h3>
        <p className="text-sm text-red-600" data-testid="stats-error">
          {error}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6"
      data-testid="canister-health-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Blog Canister Health</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className={`text-sm px-3 py-1 rounded-lg border ${
              loading
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            data-testid="refresh-stats-button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <a
            href="https://github.com/Hello-World-Co-Op/marketing-suite/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
            data-testid="pipeline-link"
          >
            View Pipeline History
          </a>
        </div>
      </div>

      {loading && !stats.total_posts ? (
        <div className="flex justify-center py-8" data-testid="stats-loading">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          data-testid="stats-grid"
        >
          <StatItem label="Total Posts" value={stats.total_posts} />
          <StatItem label="Published" value={stats.published_count} />
          <StatItem label="Drafts" value={stats.draft_count} />
          <StatItem label="Scheduled" value={stats.scheduled_count} />
          <StatItem label="Archived" value={stats.archived_count} />
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 mb-1">Storage</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${storageClasses}`}
              data-testid="stat-storage"
            >
              {storageMB} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

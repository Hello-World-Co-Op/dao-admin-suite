/**
 * BlogHealthPanel Component
 *
 * Provides a "Scan for Broken Images" button that checks all published posts
 * for image URLs returning non-200 status codes. Results are displayed as a
 * table of affected posts with broken image URLs.
 *
 * @see BL-008.7.3 Task 1 - Broken image scanner UI
 * @see FR54 - Broken Image Scanner
 * @see AC#1 - Admin can scan for broken images
 */

import {
  useBrokenImageScanner,
  type BrokenImageResult,
} from '@/hooks/useBrokenImageScanner';

/**
 * Format a status code or error type for display
 */
function formatStatus(status: number | 'timeout' | 'cors'): string {
  if (status === 'timeout') return 'Timeout';
  if (status === 'cors') return 'Unable to verify';
  return `HTTP ${status}`;
}

/**
 * Get CSS class for status badge coloring
 */
function getStatusClass(status: number | 'timeout' | 'cors'): string {
  if (status === 'cors') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export default function BlogHealthPanel() {
  const { scan, scanning, results, progress, reset, fetchError } = useBrokenImageScanner();

  const handleScan = () => {
    reset();
    scan();
  };

  const brokenResults = results.filter((r) => r.status !== 'cors');
  const corsResults = results.filter((r) => r.status === 'cors');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="blog-health-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Image Health Check</h3>
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${
            scanning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          data-testid="scan-button"
        >
          {scanning ? 'Scanning...' : 'Scan for Broken Images'}
        </button>
      </div>

      {/* Progress indicator */}
      {scanning && (
        <div className="mb-4" data-testid="scan-progress">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Checking images...</span>
            <span>
              {progress.checked} of {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.checked / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {!scanning && results.length > 0 && (
        <div data-testid="scan-results">
          {/* Broken images (non-CORS) */}
          {brokenResults.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-700 mb-2">
                Broken Images ({brokenResults.length})
              </h4>
              <ResultsTable results={brokenResults} />
            </div>
          )}

          {/* CORS-blocked images */}
          {corsResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-700 mb-2">
                Unable to Verify ({corsResults.length})
              </h4>
              <p className="text-xs text-gray-500 mb-2">
                These external images blocked the verification request. They may still be working.
              </p>
              <ResultsTable results={corsResults} />
            </div>
          )}
        </div>
      )}

      {/* Fetch error */}
      {!scanning && fetchError && (
        <p className="text-sm text-red-600" data-testid="scan-fetch-error">
          {fetchError}
        </p>
      )}

      {/* No issues found */}
      {!scanning && progress.total > 0 && results.length === 0 && !fetchError && (
        <p className="text-sm text-green-600" data-testid="scan-success">
          All {progress.total} images are working correctly.
        </p>
      )}
    </div>
  );
}

function ResultsTable({ results }: { results: BrokenImageResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm" data-testid="results-table">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Post</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Image URL</th>
            <th className="text-left py-2 font-medium text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.url} className="border-b border-gray-100">
              <td className="py-2 pr-4">
                {result.postTitles.map((title, i) => (
                  <span key={result.postIds[i]}>
                    <a
                      href={`/blog/editor/${result.postIds[i]}`}
                      className="text-blue-600 hover:underline"
                    >
                      {title}
                    </a>
                    {i < result.postTitles.length - 1 && ', '}
                  </span>
                ))}
              </td>
              <td className="py-2 pr-4 max-w-xs truncate" title={result.url}>
                <code className="text-xs bg-gray-100 px-1 rounded">{result.url}</code>
              </td>
              <td className="py-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusClass(result.status)}`}
                >
                  {formatStatus(result.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

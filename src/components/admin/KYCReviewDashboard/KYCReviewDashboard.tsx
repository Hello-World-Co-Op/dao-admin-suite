import { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import type { KYCRecord } from '@/types/user-service';
import { trackEvent } from '@/utils/analytics';
import { cn } from '@/utils/cn';

/**
 * Admin KYC Review Dashboard
 *
 * Lists all KYC cases requiring manual review (UnderReview status)
 * with SLA indicators and ability to open detail view.
 *
 * Extracted from frontend monolith - Story 2.0.4 - Task 1
 *
 * Features:
 * - Table view with SLA color coding
 * - Filtering and sorting
 * - Pagination
 * - Click to open detail panel
 * - WCAG 2.1 AA accessible
 *
 * Bridge pattern: This component uses suite-local UI elements.
 * When @hello-world-co-op/ui adds Table components, these can be
 * replaced with shared package imports.
 */

interface KYCReviewDashboardProps {
  onSelectCase?: (record: KYCRecord) => void;
}

type SLAStatus = 'green' | 'yellow' | 'red';

/**
 * Calculate SLA status based on hours pending
 * Green: < 36 hours
 * Yellow: 36-48 hours
 * Red: > 48 hours
 */
function getSLAStatus(flaggedAt: bigint | undefined): { status: SLAStatus; hours: number } {
  if (!flaggedAt) {
    return { status: 'green', hours: 0 };
  }

  const now = BigInt(Date.now() * 1_000_000); // Convert to nanoseconds
  const elapsed = now - flaggedAt;
  const hours = Number(elapsed / BigInt(3_600_000_000_000)); // Convert to hours

  let status: SLAStatus;
  if (hours < 36) {
    status = 'green';
  } else if (hours <= 48) {
    status = 'yellow';
  } else {
    status = 'red';
  }

  return { status, hours };
}

function KYCReviewDashboard({ onSelectCase }: KYCReviewDashboardProps) {
  const [cases, setCases] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'sla' | 'date'>('sla');
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  /**
   * Fetch UnderReview cases from backend
   */
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual IC agent call via @hello-world-co-op/api
        // const actor = await createActor('user-service');
        // const result = await actor.get_sla_report();

        // Mock implementation for development
        const mockCases: KYCRecord[] = [
          {
            user_id: Principal.fromText('aaaaa-aa'),
            inquiry_id: 'inq_appeal_001',
            status: { UnderReview: null },
            created_at: BigInt(Date.now() * 1_000_000),
            updated_at: BigInt(Date.now() * 1_000_000),
            verified_at: [],
            expiry_date: [],
            flagged_at: [BigInt((Date.now() - 50 * 3600 * 1000) * 1_000_000)],
            reviewer: [],
            review_notes: [],
            appeal_reason: [
              'Document quality issue - image was blurry but I have a clearer version',
            ],
            appeal_submitted_at: [BigInt((Date.now() - 50 * 3600 * 1000) * 1_000_000)],
          },
          {
            user_id: Principal.fromText('2vxsx-fae'),
            inquiry_id: 'inq_appeal_002',
            status: { UnderReview: null },
            created_at: BigInt(Date.now() * 1_000_000),
            updated_at: BigInt(Date.now() * 1_000_000),
            verified_at: [],
            expiry_date: [],
            flagged_at: [BigInt((Date.now() - 40 * 3600 * 1000) * 1_000_000)],
            reviewer: [],
            review_notes: [],
            appeal_reason: ['Name mismatch due to recent legal name change'],
            appeal_submitted_at: [BigInt((Date.now() - 40 * 3600 * 1000) * 1_000_000)],
          },
          {
            user_id: Principal.fromText('renrk-eyaaa-aaaaa-aaada-cai'),
            inquiry_id: 'inq_appeal_003',
            status: { UnderReview: null },
            created_at: BigInt(Date.now() * 1_000_000),
            updated_at: BigInt(Date.now() * 1_000_000),
            verified_at: [],
            expiry_date: [],
            flagged_at: [BigInt((Date.now() - 20 * 3600 * 1000) * 1_000_000)],
            reviewer: [],
            review_notes: [],
            appeal_reason: ['System error during verification process'],
            appeal_submitted_at: [BigInt((Date.now() - 20 * 3600 * 1000) * 1_000_000)],
          },
        ];

        setCases(mockCases);

        trackEvent('admin_kyc_dashboard_loaded', {
          case_count: mockCases.length,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load cases';
        setError(errorMessage);

        trackEvent('admin_kyc_dashboard_error', {
          error: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  /**
   * Sort cases by SLA urgency or date
   */
  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === 'sla') {
      const aTime = a.flagged_at?.[0] ?? BigInt(0);
      const bTime = b.flagged_at?.[0] ?? BigInt(0);
      return aTime < bTime ? -1 : 1;
    } else {
      return a.created_at > b.created_at ? -1 : 1;
    }
  });

  // Paginate
  const paginatedCases = sortedCases.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(sortedCases.length / itemsPerPage);

  /**
   * Handle case selection
   */
  const handleSelectCase = (record: KYCRecord) => {
    trackEvent('admin_kyc_case_selected', {
      inquiry_id: record.inquiry_id,
    });

    if (onSelectCase) {
      onSelectCase(record);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
        <p className="text-gray-600">Loading cases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
        <h3 className="text-red-800 font-medium">Error Loading Cases</h3>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="kyc-review-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">KYC Review Queue</h2>
        <p className="text-gray-600 mt-1">
          {sortedCases.length} {sortedCases.length === 1 ? 'case' : 'cases'} pending review
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'sla' | 'date')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sla">SLA Urgency</option>
            <option value="date">Date Submitted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {sortedCases.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No cases pending review</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    SLA Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Inquiry ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Appeal Reason
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hours Pending
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCases.map((caseRecord) => {
                  const flaggedTimestamp = caseRecord.flagged_at?.[0];
                  const { status: slaStatus, hours } = getSLAStatus(flaggedTimestamp);
                  const appealReason = caseRecord.appeal_reason?.[0] || 'N/A';

                  return (
                    <tr
                      key={caseRecord.inquiry_id}
                      onClick={() => handleSelectCase(caseRecord)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectCase(caseRecord);
                        }
                      }}
                      aria-label={`Review case ${caseRecord.inquiry_id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            slaStatus === 'green' && 'bg-green-100 text-green-800',
                            slaStatus === 'yellow' && 'bg-yellow-100 text-yellow-800',
                            slaStatus === 'red' && 'bg-red-100 text-red-800'
                          )}
                          aria-label={`SLA status: ${slaStatus === 'green' ? 'Good' : slaStatus === 'yellow' ? 'Approaching deadline' : 'Breached'}`}
                        >
                          {slaStatus === 'green' && 'Good'}
                          {slaStatus === 'yellow' && 'Warning'}
                          {slaStatus === 'red' && 'Breached'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {caseRecord.inquiry_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {typeof caseRecord.user_id === 'object' && 'toText' in caseRecord.user_id
                          ? caseRecord.user_id.toText().substring(0, 12) + '...'
                          : String(caseRecord.user_id).substring(0, 12) + '...'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {appealReason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {hours.toFixed(1)}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default KYCReviewDashboard;

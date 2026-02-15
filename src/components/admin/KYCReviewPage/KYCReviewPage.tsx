import { useState, useCallback } from 'react';
import type { KYCRecord, ReviewDecision } from '@/types/user-service';
import KYCReviewDashboard from '@/components/admin/KYCReviewDashboard';
import KYCReviewDetail from '@/components/admin/KYCReviewDetail';
import { trackEvent } from '@/utils/analytics';

/**
 * KYC Review Page
 *
 * Main page for admin KYC review workflow, integrating dashboard and detail views.
 * Handles the complete review lifecycle:
 * 1. Display list of cases requiring review (KYCReviewDashboard)
 * 2. Select case to review (shows KYCReviewDetail)
 * 3. Submit review decision (Approve/Reject)
 * 4. Update dashboard and close detail panel
 *
 * Extracted from frontend monolith - Story 2.0.4 - Task 3
 *
 * Features:
 * - Side-by-side dashboard and detail layout on desktop
 * - Stacked layout on mobile
 * - Review action handling with IC agent integration
 * - Success/error notifications
 * - Dashboard refresh after review submission
 */

function KYCReviewPage() {
  const [selectedCase, setSelectedCase] = useState<KYCRecord | null>(null);
  const [_submittingReview, setSubmittingReview] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handle case selection from dashboard
   */
  const handleSelectCase = useCallback((record: KYCRecord) => {
    setSelectedCase(record);
    setNotification(null);

    trackEvent('admin_kyc_case_opened', {
      inquiry_id: record.inquiry_id,
    });
  }, []);

  /**
   * Handle closing detail panel
   */
  const handleCloseDetail = useCallback(() => {
    setSelectedCase(null);
    setNotification(null);
  }, []);

  /**
   * Handle review action (Approve/Reject)
   */
  const handleReviewAction = useCallback(
    async (inquiryId: string, decision: 'Approved' | 'Rejected', _notes: string) => {
      try {
        setSubmittingReview(true);
        setNotification(null);

        // Convert string decision to ReviewDecision type
        const _reviewDecision: ReviewDecision =
          decision === 'Approved' ? { Approved: null } : { Rejected: null };

        trackEvent('admin_kyc_review_action_started', {
          inquiry_id: inquiryId,
          decision,
        });

        // TODO: Replace with actual IC agent call via @hello-world-co-op/api
        // const actor = await createActor('user-service');
        // const result = await actor.admin_review_kyc(inquiryId, reviewDecision, notes);

        // Mock implementation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Success
        setNotification({
          type: 'success',
          message: `Case ${decision.toLowerCase()} successfully. The user has been notified.`,
        });

        trackEvent('admin_kyc_review_action_success', {
          inquiry_id: inquiryId,
          decision,
        });

        // Close detail panel and refresh dashboard
        setTimeout(() => {
          setSelectedCase(null);
          setRefreshKey((prev) => prev + 1);
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';

        setNotification({
          type: 'error',
          message: errorMessage,
        });

        trackEvent('admin_kyc_review_action_failed', {
          inquiry_id: inquiryId,
          decision,
          error: errorMessage,
        });

        throw err;
      } finally {
        setSubmittingReview(false);
      }
    },
    []
  );

  return (
    <div className="kyc-review-page min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">KYC Review Administration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve identity verification cases requiring manual attention
          </p>
        </div>
      </header>

      {/* Success/Error Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div
            className={`rounded-lg p-4 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success'
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-500'
                      : 'text-red-500 hover:bg-red-100 focus:ring-red-500'
                  }`}
                  aria-label="Dismiss notification"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dashboard - Left Panel */}
          <div className={`bg-white rounded-lg shadow ${selectedCase ? 'lg:block hidden' : ''}`}>
            <div className="p-6">
              <KYCReviewDashboard key={refreshKey} onSelectCase={handleSelectCase} />
            </div>
          </div>

          {/* Detail - Right Panel */}
          {selectedCase && (
            <div className="bg-white rounded-lg shadow lg:col-span-1">
              <KYCReviewDetail
                record={selectedCase}
                onClose={handleCloseDetail}
                onAction={handleReviewAction}
              />
            </div>
          )}

          {/* Empty State - Right Panel */}
          {!selectedCase && (
            <div className="bg-white rounded-lg shadow hidden lg:flex items-center justify-center p-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No case selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a case from the dashboard to view details and take action.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default KYCReviewPage;

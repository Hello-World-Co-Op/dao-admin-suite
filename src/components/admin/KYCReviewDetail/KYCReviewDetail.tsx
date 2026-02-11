import { useState, useEffect } from 'react';
import type { KYCRecord, AuditEntry } from '@/types/user-service';
import { trackEvent } from '@/utils/analytics';
import { cn } from '@/utils/cn';

/**
 * KYC Review Detail Panel
 *
 * Displays full case information for admin review including:
 * - User and inquiry details
 * - Appeal reason
 * - Audit trail
 * - Persona inquiry data (documents, verification results)
 * - Admin action buttons
 *
 * Extracted from frontend monolith - Story 2.0.4 - Task 2
 *
 * Bridge pattern: This component uses suite-local UI elements.
 * When @hello-world-co-op/ui adds form components, these can be
 * replaced with shared package imports.
 */

interface KYCReviewDetailProps {
  record: KYCRecord;
  onClose?: () => void;
  onAction?: (inquiryId: string, decision: 'Approved' | 'Rejected', notes: string) => Promise<void>;
}

interface PersonaInquiryData {
  id: string;
  status: string;
  created_at: string;
  fields: {
    name_first?: string;
    name_last?: string;
    birthdate?: string;
    address_street_1?: string;
    address_city?: string;
    address_subdivision?: string;
    address_postal_code?: string;
    address_country_code?: string;
  };
  verifications: Array<{
    type: string;
    status: string;
    checks: Array<{
      name: string;
      status: string;
      reasons: string[];
    }>;
  }>;
  documents: Array<{
    type: string;
    status: string;
    photo_urls: string[];
  }>;
}

function KYCReviewDetail({ record, onClose, onAction }: KYCReviewDetailProps) {
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [personaData, setPersonaData] = useState<PersonaInquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  /**
   * Fetch audit trail and Persona data
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual IC agent calls via @hello-world-co-op/api
        // const actor = await createActor('user-service');
        // const auditResult = await actor.get_audit_trail(record.inquiry_id);

        // Mock audit trail
        const mockAuditTrail: AuditEntry[] = [
          {
            timestamp: record.created_at,
            actor: record.user_id,
            action: 'KYC verification initiated',
            target: record.inquiry_id,
            decision: [],
            notes: 'User started KYC process',
          },
          {
            timestamp: record.flagged_at?.[0] ?? record.created_at,
            actor: record.user_id,
            action: 'Verification failed by Persona',
            target: record.inquiry_id,
            decision: [],
            notes: 'Automatic verification failed - flagged for manual review',
          },
        ];

        if (record.appeal_reason && record.appeal_reason.length > 0) {
          mockAuditTrail.push({
            timestamp: record.appeal_submitted_at?.[0] ?? record.updated_at,
            actor: record.user_id,
            action: 'Appeal submitted',
            target: record.inquiry_id,
            decision: [],
            notes: record.appeal_reason[0] ?? 'Appeal submitted',
          });
        }

        setAuditTrail(mockAuditTrail);

        // Mock Persona inquiry data
        const mockPersonaData: PersonaInquiryData = {
          id: record.inquiry_id,
          status: 'failed',
          created_at: new Date(Number(record.created_at / BigInt(1_000_000))).toISOString(),
          fields: {
            name_first: 'John',
            name_last: 'Doe',
            birthdate: '1990-01-15',
            address_street_1: '123 Main St',
            address_city: 'San Francisco',
            address_subdivision: 'CA',
            address_postal_code: '94102',
            address_country_code: 'US',
          },
          verifications: [
            {
              type: 'government-id',
              status: 'failed',
              checks: [
                {
                  name: 'id_age_inconsistency',
                  status: 'failed',
                  reasons: ['Date of birth on document does not match provided information'],
                },
                {
                  name: 'id_image_quality',
                  status: 'passed',
                  reasons: [],
                },
              ],
            },
          ],
          documents: [
            {
              type: 'drivers_license',
              status: 'submitted',
              photo_urls: ['https://example.com/dl_front.jpg', 'https://example.com/dl_back.jpg'],
            },
          ],
        };

        setPersonaData(mockPersonaData);

        trackEvent('admin_kyc_detail_loaded', {
          inquiry_id: record.inquiry_id,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load case details';
        setError(errorMessage);

        trackEvent('admin_kyc_detail_error', {
          inquiry_id: record.inquiry_id,
          error: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [record]);

  /**
   * Handle admin action (approve/reject)
   */
  const handleAction = async (decision: 'Approved' | 'Rejected') => {
    if (!actionNotes.trim()) {
      setError('Review notes are required');
      return;
    }

    try {
      setActionSubmitting(true);
      setError(null);

      trackEvent('admin_kyc_review_submitted', {
        inquiry_id: record.inquiry_id,
        decision,
        notes_length: actionNotes.length,
      });

      if (onAction) {
        await onAction(record.inquiry_id, decision, actionNotes);
      }

      trackEvent('admin_kyc_review_success', {
        inquiry_id: record.inquiry_id,
        decision,
      });

      // Close panel on success
      if (onClose) {
        onClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);

      trackEvent('admin_kyc_review_failed', {
        inquiry_id: record.inquiry_id,
        decision,
        error: errorMessage,
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  /**
   * Format timestamp to readable date
   */
  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format Principal to short string
   */
  const formatPrincipal = (principal: { toText: () => string } | string): string => {
    if (typeof principal === 'object' && 'toText' in principal) {
      const text = principal.toText();
      return text.length > 20 ? text.substring(0, 20) + '...' : text;
    }
    return String(principal).substring(0, 20) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
        <p className="text-gray-600">Loading case details...</p>
      </div>
    );
  }

  return (
    <div className="kyc-review-detail bg-white h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">KYC Review</h2>
            <p className="text-sm text-gray-600 mt-1 font-mono">{record.inquiry_id}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              aria-label="Close detail panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Case Summary */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Summary</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900">
                {formatPrincipal(record.user_id)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Under Review
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatTimestamp(record.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Flagged At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {record.flagged_at &&
                record.flagged_at.length > 0 &&
                record.flagged_at[0] !== undefined
                  ? formatTimestamp(record.flagged_at[0])
                  : 'N/A'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Appeal Reason */}
        {record.appeal_reason && record.appeal_reason.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appeal Reason</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-900">{record.appeal_reason[0]}</p>
              {record.appeal_submitted_at &&
                record.appeal_submitted_at.length > 0 &&
                record.appeal_submitted_at[0] !== undefined && (
                  <p className="text-xs text-gray-600 mt-2">
                    Submitted {formatTimestamp(record.appeal_submitted_at[0])}
                  </p>
                )}
            </div>
          </section>
        )}

        {/* Persona Inquiry Data */}
        {personaData && (
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Details</h3>

            {/* User Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Submitted Information</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {personaData.fields.name_first} {personaData.fields.name_last}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {personaData.fields.birthdate || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {personaData.fields.address_street_1}
                    <br />
                    {personaData.fields.address_city}, {personaData.fields.address_subdivision}{' '}
                    {personaData.fields.address_postal_code}
                    <br />
                    {personaData.fields.address_country_code}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Verification Checks */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Verification Checks</h4>
              {personaData.verifications.map((verification, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {verification.type.replace('-', ' ')}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        verification.status === 'passed' && 'bg-green-100 text-green-800',
                        verification.status === 'failed' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {verification.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {verification.checks.map((check, checkIdx) => (
                      <div key={checkIdx} className="text-sm">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'inline-block w-5 h-5 rounded-full flex-shrink-0 mt-0.5',
                              check.status === 'passed' ? 'bg-green-500' : 'bg-red-500'
                            )}
                            aria-label={check.status === 'passed' ? 'Passed' : 'Failed'}
                          >
                            {check.status === 'passed' ? (
                              <svg
                                className="w-5 h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 capitalize">
                              {check.name.replace(/_/g, ' ')}
                            </p>
                            {check.reasons.length > 0 && (
                              <ul className="mt-1 text-gray-600 list-disc list-inside">
                                {check.reasons.map((reason, reasonIdx) => (
                                  <li key={reasonIdx}>{reason}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Documents */}
            {personaData.documents.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Submitted Documents</h4>
                <div className="space-y-2">
                  {personaData.documents.map((doc, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 capitalize mb-2">
                        {doc.type.replace('_', ' ')}
                      </p>
                      <div className="flex gap-2">
                        {doc.photo_urls.map((_url, urlIdx) => (
                          <div
                            key={urlIdx}
                            className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center"
                          >
                            <span className="text-xs text-gray-500">Document {urlIdx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Audit Trail */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
          <div className="space-y-4">
            {auditTrail.map((entry, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1 pb-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                    </div>
                    <time className="text-xs text-gray-500 ml-4">
                      {formatTimestamp(entry.timestamp)}
                    </time>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    Actor: {formatPrincipal(entry.actor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Admin Actions */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Decision</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label htmlFor="action-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="action-notes"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Document your review decision and reasoning..."
              disabled={actionSubmitting}
              required
            />
            <p className="text-xs text-gray-600 mt-2">
              These notes will be recorded in the audit trail and may be visible to the user.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleAction('Approved')}
                disabled={actionSubmitting || !actionNotes.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionSubmitting ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction('Rejected')}
                disabled={actionSubmitting || !actionNotes.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionSubmitting ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default KYCReviewDetail;

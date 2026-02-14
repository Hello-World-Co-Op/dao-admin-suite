/**
 * AuthorManagement Component
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 2.1: Create AuthorManagement component with table view
 *
 * Displays a table of current author roles with ability to:
 * - Add new authors via AddAuthorModal
 * - Revoke existing author roles with confirmation dialog
 * - View principal, display name, display role, and role badge
 *
 * Always fetches fresh data (no caching, per anti-pattern #3).
 * Uses optimistic-free pattern (waits for canister confirmation, per anti-pattern #7).
 *
 * @see AC2 - Author role management - search by principal, assign/revoke roles
 * @see FR33 - Admin UI for author management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listAuthorRoles,
  setAuthorRole,
  removeAuthorRole,
  type AuthorRoleEntry,
} from '@/utils/blogApi';
import AddAuthorModal from './AddAuthorModal';
import AuthorRow from './AuthorRow';

export default function AuthorManagement() {
  const [authors, setAuthors] = useState<AuthorRoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  // Revoke confirmation dialog state
  const [revokeTarget, setRevokeTarget] = useState<{ principal: string; displayName: string } | null>(null);

  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
  }, []);

  /**
   * Load author roles from canister. Always fetches fresh (anti-pattern #3).
   */
  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const roles = await listAuthorRoles();
      setAuthors(roles);
      setError(null);
    } catch {
      setError('Failed to load author roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  /**
   * Handle adding a new author. Waits for canister confirmation (anti-pattern #7).
   */
  const handleAddAuthor = useCallback(async (data: {
    principal: string;
    role: 'Admin' | 'Author';
    displayName: string;
    displayRole: string;
  }) => {
    setIsSubmitting(true);
    try {
      await setAuthorRole(data.principal, data.role, data.displayName, data.displayRole);
      showToastMessage(`${data.displayName} added as ${data.role}`);
      setShowAddModal(false);
      // Refresh list after successful add
      await loadAuthors();
    } catch (err) {
      showToastMessage(
        err instanceof Error ? err.message : 'Failed to add author',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [loadAuthors, showToastMessage]);

  /**
   * Initiate revoke: show confirmation dialog (anti-pattern #4).
   */
  const handleRevokeClick = useCallback((principal: string, displayName: string) => {
    setRevokeTarget({ principal, displayName });
  }, []);

  /**
   * Confirm revoke: call canister then refresh.
   */
  const handleRevokeConfirm = useCallback(async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await removeAuthorRole(revokeTarget.principal);
      showToastMessage(`Revoked role from ${revokeTarget.displayName}`);
      setRevokeTarget(null);
      await loadAuthors();
    } catch (err) {
      showToastMessage(
        err instanceof Error ? err.message : 'Failed to revoke role',
        'error',
      );
    } finally {
      setIsRevoking(false);
    }
  }, [revokeTarget, loadAuthors, showToastMessage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="author-management">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="author-management">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Author Management</h3>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          data-testid="add-author-button"
        >
          Add Author
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm" data-testid="author-error">
          {error}
          <button
            type="button"
            onClick={loadAuthors}
            className="ml-2 underline hover:no-underline"
            data-testid="author-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {!error && authors.length === 0 && (
        <p className="text-gray-500 text-sm" data-testid="no-authors">
          No authors configured yet. Add one to get started.
        </p>
      )}

      {authors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="author-table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {authors.map((author) => (
                <AuthorRow
                  key={author.principal}
                  author={author}
                  onRevoke={handleRevokeClick}
                  isRevoking={isRevoking && revokeTarget?.principal === author.principal}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Author Modal */}
      <AddAuthorModal
        visible={showAddModal}
        onSubmit={handleAddAuthor}
        onCancel={() => setShowAddModal(false)}
        isSubmitting={isSubmitting}
      />

      {/* Revoke Confirmation Dialog (anti-pattern #4: must not bypass) */}
      {revokeTarget && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="revoke-confirm-dialog"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Revoke Author Role</h2>
            <p className="text-gray-600 mb-4">
              Remove the author role from <span className="font-semibold">{revokeTarget.displayName}</span>?
              They will no longer be able to create or edit blog posts.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                data-testid="revoke-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                disabled={isRevoking}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isRevoking
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                data-testid="revoke-confirm"
              >
                {isRevoking ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast.visible && (
        <div
          className={`mt-4 px-4 py-2 rounded-lg text-sm ${
            toast.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
          role="status"
          data-testid="author-toast"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

/**
 * UserRolePanel Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 4: Inline role management panel for a selected user
 *
 * Shows user info, current role badges with revoke buttons, "Add Role"
 * dropdown, warning banner, and confirmation modal for all mutations.
 * Fetches fresh state from oracle-bridge after every mutation (no optimistic updates).
 *
 * @see AC4 - Panel shows user info and roles
 * @see AC5 - Assign dropdown with non-assigned roles only
 * @see AC6 - Revoke buttons on role badges
 * @see AC8 - Success toast on role change
 * @see AC10 - Self-revoke guard for admin role
 * @see AC11 - Only admin/moderator/developer in dropdown
 * @see AC12 - Session logout warning banner
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getUserRoles, assignRole, revokeRole } from '@/services/roles-client';
import { RoleAssignConfirmModal } from './RoleAssignConfirmModal';
import type { UserWithRoles } from '@/services/roles-client';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  moderator: 'bg-yellow-100 text-yellow-800',
  developer: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
};

const ASSIGNABLE_ROLES = ['admin', 'moderator', 'developer'] as const;

interface UserRolePanelProps {
  user: UserWithRoles;
  currentUserId: string;
  onClose: () => void;
  onRoleChange: () => void;
}

interface ConfirmState {
  action: 'assign' | 'revoke';
  role: string;
}

export function UserRolePanel({ user, currentUserId, onClose, onRoleChange }: UserRolePanelProps) {
  const [currentRoles, setCurrentRoles] = useState<string[]>(user.roles);
  const [selectedRole, setSelectedRole] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup toast timer on unmount to prevent state update on unmounted component
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const availableRoles = ASSIGNABLE_ROLES.filter((r) => !currentRoles.includes(r));
  const isSelfAdmin = currentUserId === user.user_id;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const refreshRoles = useCallback(async () => {
    try {
      const freshUser = await getUserRoles(user.user_id);
      setCurrentRoles(freshUser.roles);
    } catch {
      // If refresh fails, keep current state
    }
  }, [user.user_id]);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmState) return;

    setIsSubmitting(true);
    try {
      if (confirmState.action === 'assign') {
        await assignRole(user.user_id, confirmState.role as 'admin' | 'moderator' | 'developer');
        showToast(`Successfully assigned ${confirmState.role} role`);
      } else {
        await revokeRole(user.user_id, confirmState.role as 'admin' | 'moderator' | 'developer');
        showToast(`Successfully revoked ${confirmState.role} role`);
      }
      setConfirmState(null);
      setSelectedRole('');
      await refreshRoles();
      onRoleChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Operation failed',
        'error',
      );
      setConfirmState(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmState, user.user_id, showToast, refreshRoles, onRoleChange]);

  const handleAssignClick = useCallback(() => {
    if (!selectedRole) return;
    setConfirmState({ action: 'assign', role: selectedRole });
  }, [selectedRole]);

  const handleRevokeClick = useCallback((role: string) => {
    setConfirmState({ action: 'revoke', role });
  }, []);

  const truncatedId = user.user_id.length > 8
    ? `${user.user_id.slice(0, 8)}...`
    : user.user_id;

  const badgeColor = (role: string) => ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="border-t border-b border-blue-200 bg-blue-50 px-6 py-4" data-testid="user-role-panel">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-gray-900">Manage Roles</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          data-testid="panel-close-btn"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User info section */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>
          <span className="text-gray-500">Name:</span>{' '}
          <span className="font-medium text-gray-900">{user.display_name}</span>
        </div>
        <div>
          <span className="text-gray-500">Email:</span>{' '}
          <span className="font-medium text-gray-900">{user.email_preview}</span>
        </div>
        <div>
          <span className="text-gray-500">User ID:</span>{' '}
          <span className="font-mono text-gray-700">{truncatedId}</span>
        </div>
        <div>
          <span className="text-gray-500">Status:</span>{' '}
          <span className={`font-medium ${user.verified ? 'text-green-700' : 'text-gray-500'}`}>
            {user.verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Session warning banner (AC12) */}
      <div
        className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
        data-testid="session-warning-banner"
      >
        <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-amber-800">
          Assigning or revoking a role will immediately log this user out of all active sessions.
        </p>
      </div>

      {/* Current roles with revoke buttons */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Roles</h4>
        {currentRoles.length === 0 ? (
          <p className="text-sm text-gray-400">No special roles</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentRoles.map((role) => {
              const isAdminSelfRevoke = isSelfAdmin && role === 'admin';
              const isAssignable = ASSIGNABLE_ROLES.includes(role as typeof ASSIGNABLE_ROLES[number]);

              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor(role)}`}
                >
                  {role}
                  {isAssignable && (
                    <button
                      type="button"
                      onClick={() => handleRevokeClick(role)}
                      disabled={isAdminSelfRevoke || isSubmitting}
                      title={isAdminSelfRevoke ? 'Cannot revoke your own admin role' : `Revoke ${role}`}
                      className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full ${
                        isAdminSelfRevoke
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-current hover:bg-black hover:bg-opacity-10 cursor-pointer'
                      }`}
                      data-testid={isAdminSelfRevoke ? 'revoke-btn-admin-disabled' : `revoke-btn-${role}`}
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Role section (AC5, AC11) */}
      {availableRoles.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="block w-40 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="add-role-select"
          >
            <option value="">Select role...</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssignClick}
            disabled={!selectedRole || isSubmitting}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-blue-300 disabled:cursor-not-allowed inline-flex items-center gap-1"
            data-testid="assign-role-btn"
          >
            {isSubmitting && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" data-testid="panel-loading-spinner">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Assign
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && toast.visible && (
        <div
          className={`mb-2 px-3 py-2 rounded-lg text-sm ${
            toast.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
          role="status"
          data-testid="role-toast"
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmState && (
        <RoleAssignConfirmModal
          visible={!!confirmState}
          action={confirmState.action}
          role={confirmState.role}
          userName={user.display_name}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

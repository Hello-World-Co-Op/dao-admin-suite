/**
 * RoleAssignConfirmModal Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 3: Confirmation modal for role assignment/revocation
 *
 * Shows action type, role name, target user, and session logout warning
 * before executing any role change.
 *
 * @see AC7 - Confirm modal before every assign/revoke
 * @see AC12 - Warning about session logout
 */

interface RoleAssignConfirmModalProps {
  visible: boolean;
  action: 'assign' | 'revoke';
  role: string;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RoleAssignConfirmModal({
  visible,
  action,
  role,
  userName,
  onConfirm,
  onCancel,
  isSubmitting,
}: RoleAssignConfirmModalProps) {
  if (!visible) return null;

  const title = action === 'assign' ? `Assign ${role}` : `Revoke ${role}`;
  const preposition = action === 'assign' ? 'to' : 'from';
  const body = `Are you sure you want to ${action} the ${role} role ${preposition} ${userName}?`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="role-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-confirm-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 id="role-confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{body}</p>

        {/* Session logout warning (AC12) */}
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <svg
            className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm text-amber-800">
            This will log out the user from all active sessions immediately.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            data-testid="role-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-2 ${
              action === 'revoke'
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
            } disabled:cursor-not-allowed`}
            data-testid="role-confirm-btn"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

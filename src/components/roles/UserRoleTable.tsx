/**
 * UserRoleTable Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 5: Table view of users with their current platform roles
 *
 * Shows Display Name, Email Preview, Verified Status, Current Roles,
 * and "Manage Roles" action button for each user.
 *
 * @see AC2 - User list with display name, email preview, verified, role badges
 * @see AC3 - Search filtering (handled by parent via data prop)
 * @see AC4 - Clicking "Manage Roles" opens UserRolePanel
 */

import type { UserWithRoles } from '@/services/roles-client';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  moderator: 'bg-yellow-100 text-yellow-800',
  developer: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
};

interface UserRoleTableProps {
  users: UserWithRoles[];
  currentUserId: string;
  loading: boolean;
  onManageRoles: (user: UserWithRoles) => void;
  selectedUserId?: string;
}

export function UserRoleTable({ users, loading, onManageRoles, selectedUserId }: UserRoleTableProps) {
  if (loading) {
    return (
      <div data-testid="table-loading-skeleton" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex space-x-4 px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="empty-state">
        No users found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="user-role-table">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Display Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Roles
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr
              key={user.user_id}
              className={`hover:bg-gray-50 ${selectedUserId === user.user_id ? 'bg-blue-50' : ''}`}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {user.display_name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {user.email_preview}
              </td>
              <td className="px-4 py-3 text-sm" data-testid={`user-verified-${user.user_id}`}>
                {user.verified ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3" data-testid={`user-roles-cell-${user.user_id}`}>
                {user.roles.length === 0 ? (
                  <span className="text-sm text-gray-400">No special roles</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onManageRoles(user)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  data-testid={`manage-roles-btn-${user.user_id}`}
                >
                  Manage Roles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

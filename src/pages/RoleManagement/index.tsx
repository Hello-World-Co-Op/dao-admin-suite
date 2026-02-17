/**
 * RoleManagement Page
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 7: Main page component with tabs (Users & Roles / Audit Log)
 *
 * Manages state for user list, search, pagination, and panel selection.
 * Auth is handled by ProtectedRoute in App.tsx (AC1).
 *
 * @see AC1 - /roles route protected with requiredRole="admin"
 * @see AC2 - User list loads on page open, paginated at 25 per page
 * @see AC3 - Search with debounce
 * @see AC9 - Audit log tab with polling
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@hello-world-co-op/auth';
import { listUsers } from '@/services/roles-client';
import { UserRoleSearch } from '@/components/roles/UserRoleSearch';
import { UserRoleTable } from '@/components/roles/UserRoleTable';
import { UserRolePanel } from '@/components/roles/UserRolePanel';
import { RoleAuditLog } from '@/components/roles/RoleAuditLog';
import type { UserWithRoles, PaginatedUsersResponse } from '@/services/roles-client';

const PAGE_SIZE = 25;

type Tab = 'users' | 'audit';

export default function RoleManagement() {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [usersData, setUsersData] = useState<PaginatedUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  const fetchUsers = useCallback(async (fetchPage: number, search: string, syncSelectedUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listUsers(fetchPage, PAGE_SIZE, search || undefined);
      setUsersData(result);
      // Sync selectedUser with fresh data so panel doesn't show stale roles
      if (syncSelectedUserId) {
        const fresh = result.users.find((u) => u.user_id === syncSelectedUserId);
        if (fresh) setSelectedUser(fresh);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers(1, '');
  }, [fetchUsers]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSelectedUser(null);
    fetchUsers(1, query);
  }, [fetchUsers]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedUser(null);
    fetchUsers(newPage, searchQuery);
  }, [fetchUsers, searchQuery]);

  const handleManageRoles = useCallback((user: UserWithRoles) => {
    setSelectedUser((prev) => (prev?.user_id === user.user_id ? null : user));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleRoleChange = useCallback(() => {
    // Re-fetch current page to refresh roles in table.
    // Pass selectedUser's id so fetchUsers can sync the open panel's user prop.
    fetchUsers(page, searchQuery, selectedUser?.user_id);
  }, [fetchUsers, page, searchQuery, selectedUser?.user_id]);

  const handleRetry = useCallback(() => {
    fetchUsers(page, searchQuery);
  }, [fetchUsers, page, searchQuery]);

  const users = usersData?.users ?? [];
  const total = usersData?.total ?? 0;
  const hasNext = usersData?.has_next ?? false;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="role-management-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-2">
            Platform access role assignment and audit
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-users"
            >
              Users &amp; Roles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-audit"
            >
              Audit Log
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            {/* Search bar */}
            <div className="p-4 border-b border-gray-200">
              <UserRoleSearch onSearch={handleSearch} disabled={loading} />
              {/* II-only users info note */}
              <p className="mt-2 text-xs text-gray-400">
                Users registered via Internet Identity only may not appear here. Use direct User ID lookup.
              </p>
            </div>

            {/* Error state */}
            {error && (
              <div className="p-4 text-center">
                <p className="text-red-600 mb-2" data-testid="users-error">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  data-testid="users-retry-btn"
                >
                  Retry
                </button>
              </div>
            )}

            {/* User table */}
            {!error && (
              <>
                <UserRoleTable
                  users={users}
                  loading={loading}
                  onManageRoles={handleManageRoles}
                  selectedUserId={selectedUser?.user_id}
                />

                {/* Inline role panel */}
                {selectedUser && (
                  <UserRolePanel
                    user={selectedUser}
                    currentUserId={currentUserId}
                    onClose={handleClosePanel}
                    onRoleChange={handleRoleChange}
                  />
                )}

                {/* Pagination */}
                {!loading && total > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {showingStart}–{showingEnd} of {total} users
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="pagination-prev"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasNext}
                        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="pagination-next"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow">
            <RoleAuditLog active={activeTab === 'audit'} />
          </div>
        )}
      </main>
    </div>
  );
}

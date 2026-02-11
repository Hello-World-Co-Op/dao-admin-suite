/**
 * Member Management Page
 *
 * Admin interface for managing DAO members:
 * - Member approval/rejection
 * - Status changes (active, suspended, revoked)
 * - Member directory browsing
 *
 * TODO: Implement with actual canister integration via @hello-world-co-op/api
 */
export default function MemberManagement() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage member approvals, status changes, and revocations
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Member Management</h3>
          <p className="mt-2 text-gray-600">
            Member management features will be connected to the membership canister.
          </p>
        </div>
      </main>
    </div>
  );
}

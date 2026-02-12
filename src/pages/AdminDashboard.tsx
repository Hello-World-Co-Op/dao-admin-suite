import { Link } from 'react-router-dom';

/**
 * Admin Dashboard Page
 *
 * Main landing page for DAO administrators showing summary stats
 * and navigation to admin functions.
 *
 * Admin role enforcement is provided by RoleGuard in ProtectedRoute (BL-007.4).
 */
export default function AdminDashboard() {
  const adminSections = [
    {
      title: 'KYC Management',
      description: 'Review and approve identity verification cases',
      path: '/kyc',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      stats: '3 pending',
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      title: 'Member Management',
      description: 'Manage member approvals, status changes, and revocations',
      path: '/members',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      stats: 'Active',
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Governance Oversight',
      description: 'Monitor proposals, voting, and governance activity',
      path: '/governance',
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      stats: 'Active',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Treasury Management',
      description: 'Manage payout approvals and escrow operations',
      path: '/treasury',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      stats: 'Active',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'System Monitoring',
      description: 'Check canister health, system status, and metrics',
      path: '/monitoring',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      stats: 'Online',
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Content Moderation',
      description: 'Review and moderate user-generated content',
      path: '/moderation',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
      stats: 'Active',
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Hello World DAO administration and oversight tools
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.path}
              to={section.path}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={section.icon}
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  <span className={`inline-block mt-3 text-xs font-medium px-2 py-1 rounded ${section.color}`}>
                    {section.stats}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

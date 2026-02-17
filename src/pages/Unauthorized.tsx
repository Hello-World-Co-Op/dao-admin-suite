/**
 * Unauthorized Page
 *
 * Displayed when an authenticated user lacks admin role.
 * Provides clear messaging, a link back to the DAO portal, and logout option.
 *
 * @see BL-007.4 AC2 - Non-admin users see /unauthorized page
 */

import { ShieldX } from 'lucide-react';
import { useAuth } from '@hello-world-co-op/auth';

export default function Unauthorized() {
  const portalUrl =
    import.meta.env.VITE_DAO_FRONTEND_URL || 'https://portal.helloworlddao.com';

  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Admin Access Required
        </h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have the required permissions to access the admin
          dashboard. Contact a platform administrator if you believe this is an
          error.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={portalUrl}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Portal
          </a>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

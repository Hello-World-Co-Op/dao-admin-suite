import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { RoleGuard } from '@hello-world-co-op/auth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import Unauthorized from '@/pages/Unauthorized';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Wraps protected pages ensuring the user is:
 * 1. Authenticated (via useAdminAuth hook)
 * 2. Has the 'admin' role (via RoleGuard from @hello-world-co-op/auth)
 *
 * Unauthenticated users are redirected to /login.
 * Authenticated non-admin users see the Unauthorized page.
 * Loading state is shown during both auth and role verification (no content flash).
 *
 * @see BL-007.4 AC1 - RoleGuard wraps all admin routes
 * @see BL-007.4 AC3 - Unauthenticated users redirected to login
 * @see BL-007.4 AC4 - Admin role verified on each protected route load
 * @see BL-007.4 AC6 - Loading state shown during role verification
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, userId } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (AC3)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // E2E bypass: skip RoleGuard when auth bypass is active (no AuthProvider roles in CI)
  if (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true') {
    return <>{children}</>;
  }

  // RoleGuard checks admin role via AuthProvider context (AC1, AC4, AC5, AC6)
  // DEV-only console logging is handled in UnauthorizedWithLogging fallback (AC7)
  return (
    <RoleGuard
      requiredRole="admin"
      fallback={<UnauthorizedWithLogging userId={userId} />}
    >
      <>{children}</>
    </RoleGuard>
  );
}

/**
 * Wrapper that logs unauthorized attempts in DEV mode before rendering
 * the Unauthorized page.
 */
function UnauthorizedWithLogging({ userId }: { userId: string | null }) {
  // AC7: DEV-only console logging for unauthorized attempts
  if (import.meta.env.DEV) {
    console.warn('[AdminGuard] Unauthorized access attempt:', { userId });
  }
  return <Unauthorized />;
}

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Wraps protected pages and ensures user is authenticated before rendering.
 * Redirects to /login (LoginRedirect) if user is not authenticated.
 *
 * NOTE: This uses a simplified auth check. RBAC enforcement via AdminGuard
 * is a SEPARATE story (FAS-7.2) that depends on bl-007 (RBAC Implementation).
 *
 * Bridge pattern: Suite-specific ProtectedRoute adapted from dao-suite.
 * Uses useAdminAuth hook for auth state management.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
}

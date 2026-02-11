import { useState, useEffect, useCallback } from 'react';

/**
 * Admin Authentication Hook
 *
 * Provides authentication state for the admin suite.
 * Uses cookie/token-based auth from cross-subdomain SSO.
 *
 * NOTE: RBAC enforcement (AdminGuard checking admin role) comes in FAS-7.2
 * (dependency: bl-007). This hook currently only checks if the user is
 * authenticated, not if they have admin permissions.
 *
 * Bridge pattern: Suite-specific auth hook. When @hello-world-co-op/auth
 * exports useAuth() with role checking, this can delegate to that.
 */

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
  });

  const checkAuth = useCallback(() => {
    try {
      // Check for auth bypass in development/E2E
      if (
        import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' ||
        import.meta.env.VITE_E2E_AUTH_BYPASS === 'true'
      ) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          userId: 'dev-admin-user',
        });
        return;
      }

      // Check for stored auth tokens
      const accessToken = sessionStorage.getItem('access_token');
      const userId = sessionStorage.getItem('user_id');

      if (accessToken && userId) {
        // TODO: Validate token expiry and refresh if needed
        // This will be enhanced when integrating with @hello-world-co-op/auth
        setState({
          isAuthenticated: true,
          isLoading: false,
          userId,
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          userId: null,
        });
      }
    } catch (_error) {
      console.error('Auth check failed:', _error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return state;
}

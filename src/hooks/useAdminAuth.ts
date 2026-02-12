import { useState, useEffect, useCallback } from 'react';

/**
 * Admin Authentication Hook
 *
 * Provides authentication state for the admin suite.
 *
 * Auth check order (FAS-8.1 SSO support):
 * 1. Cookie-based session via oracle-bridge (shared across *.helloworlddao.com)
 * 2. sessionStorage tokens (legacy, per-suite)
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

/**
 * Check cookie-based session via oracle-bridge (FAS-8.1 SSO)
 */
async function checkCookieSession(): Promise<{ authenticated: boolean; userId?: string }> {
  const baseUrl = import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();
  return {
    authenticated: data.authenticated === true,
    userId: data.user_id,
  };
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
  });

  const checkAuth = useCallback(async () => {
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

      // FAS-8.1: Check cookie-based session first (cross-suite SSO)
      try {
        const session = await checkCookieSession();
        if (session.authenticated) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            userId: session.userId ?? null,
          });
          return;
        }
      } catch {
        // Cookie session check failed — fall through to sessionStorage
      }

      // Legacy: Check for stored auth tokens
      const accessToken = sessionStorage.getItem('access_token');
      const userId = sessionStorage.getItem('user_id');

      if (accessToken && userId) {
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

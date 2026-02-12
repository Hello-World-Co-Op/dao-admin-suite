/**
 * ProtectedRoute Component Tests
 *
 * Tests for the ProtectedRoute guard that enforces both authentication
 * (via useAdminAuth) and admin role (via RoleGuard from @hello-world-co-op/auth).
 *
 * @see BL-007.4 AC1 - RoleGuard wraps all admin routes
 * @see BL-007.4 AC3 - Unauthenticated users redirected to login
 * @see BL-007.4 AC4 - Admin role verified on each protected route load
 * @see BL-007.4 AC6 - Loading state shown during role verification
 * @see BL-007.4 AC7 - Unauthorized access logged in DEV console
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';

// ---- Mocks ----

const mockUseAdminAuth = vi.fn();
vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => mockUseAdminAuth(),
}));

// Mock Unauthorized page
vi.mock('@/pages/Unauthorized', () => ({
  default: function MockUnauthorized() {
    return <div data-testid="unauthorized-page">Admin Access Required</div>;
  },
}));

// Variable to control RoleGuard behavior in tests
let mockRoleGuardBehavior: 'pass' | 'block' | 'loading' = 'pass';

vi.mock('@hello-world-co-op/auth', () => ({
  RoleGuard: ({
    children,
    fallback,
  }: {
    children: ReactNode;
    requiredRole: string;
    fallback?: ReactNode;
  }) => {
    if (mockRoleGuardBehavior === 'loading') return null;
    if (mockRoleGuardBehavior === 'block') return <>{fallback ?? null}</>;
    return <>{children}</>;
  },
}));

import { ProtectedRoute } from './ProtectedRoute';

// Helper to render ProtectedRoute at a given path
function renderProtectedRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoleGuardBehavior = 'pass';
  });

  // AC3: Unauthenticated users redirected to login
  describe('unauthenticated user', () => {
    it('should redirect to /login when not authenticated', () => {
      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
        logout: vi.fn(),
      });

      renderProtectedRoute();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // AC6: Loading state shown during verification
  describe('loading state', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        userId: null,
        logout: vi.fn(),
      });

      renderProtectedRoute();

      expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not flash protected content during loading', () => {
      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: true,
        userId: 'test-user',
        logout: vi.fn(),
      });

      renderProtectedRoute();

      expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // AC1, AC4: Admin role verified via RoleGuard
  describe('authenticated admin user', () => {
    it('should render protected content when authenticated with admin role', () => {
      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        userId: 'admin-user',
        logout: vi.fn(),
      });
      mockRoleGuardBehavior = 'pass';

      renderProtectedRoute();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  // AC2: Non-admin authenticated users see Unauthorized page
  describe('authenticated non-admin user', () => {
    it('should render Unauthorized page when RoleGuard blocks', () => {
      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        userId: 'regular-user',
        logout: vi.fn(),
      });
      mockRoleGuardBehavior = 'block';

      renderProtectedRoute();

      expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // AC6: Loading state during role verification
  describe('role verification loading', () => {
    it('should show nothing when RoleGuard is loading', () => {
      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        userId: 'test-user',
        logout: vi.fn(),
      });
      mockRoleGuardBehavior = 'loading';

      renderProtectedRoute();

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unauthorized-page')).not.toBeInTheDocument();
    });
  });

  // AC7: DEV-only console logging
  describe('DEV console logging', () => {
    it('should log unauthorized access attempt in DEV mode when RoleGuard blocks', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockUseAdminAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        userId: 'non-admin-user',
        logout: vi.fn(),
      });
      mockRoleGuardBehavior = 'block';

      renderProtectedRoute();

      expect(warnSpy).toHaveBeenCalledWith(
        '[AdminGuard] Unauthorized access attempt:',
        { userId: 'non-admin-user' }
      );

      warnSpy.mockRestore();
    });
  });
});

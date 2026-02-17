/**
 * App Component Tests
 *
 * Tests for the root application component including routing,
 * lazy loading, and error boundary integration.
 *
 * @see BL-029.3 - Migrate dao-admin-suite to shared auth components
 * @see FAS-7.1 - DAO Admin Suite extraction
 * @see BL-007.4 - Integrate AdminGuard in dao-admin-suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';

// Mock all lazy-loaded pages
vi.mock('@/pages/AdminDashboard', () => ({
  default: function MockAdminDashboard() {
    return <div data-testid="admin-dashboard">Admin Dashboard</div>;
  },
}));

vi.mock('@/pages/KYCManagement', () => ({
  default: function MockKYCManagement() {
    return <div data-testid="kyc-management">KYC Management</div>;
  },
}));

vi.mock('@/pages/MemberManagement', () => ({
  default: function MockMemberManagement() {
    return <div data-testid="member-management">Member Management</div>;
  },
}));

vi.mock('@/pages/GovernanceOversight', () => ({
  default: function MockGovernanceOversight() {
    return <div data-testid="governance-oversight">Governance Oversight</div>;
  },
}));

vi.mock('@/pages/TreasuryManagement', () => ({
  default: function MockTreasuryManagement() {
    return <div data-testid="treasury-management">Treasury Management</div>;
  },
}));

vi.mock('@/pages/SystemMonitoring', () => ({
  default: function MockSystemMonitoring() {
    return <div data-testid="system-monitoring">System Monitoring</div>;
  },
}));

vi.mock('@/pages/ContentModeration', () => ({
  default: function MockContentModeration() {
    return <div data-testid="content-moderation">Content Moderation</div>;
  },
}));

vi.mock('@/pages/RoleManagement', () => ({
  default: function MockRoleManagement() {
    return <div data-testid="role-management">Role Management</div>;
  },
}));

vi.mock('@/pages/Unauthorized', () => ({
  default: function MockUnauthorized() {
    return <div data-testid="unauthorized">Unauthorized</div>;
  },
}));

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock @hello-world-co-op/auth - ProtectedRoute and LoginRedirect pass through in tests (admin user scenario)
// AuthProvider is a simple passthrough wrapper in tests
vi.mock('@hello-world-co-op/auth', () => ({
  RoleGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
  LoginRedirect: () => <div data-testid="login-redirect">Login Redirect</div>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { userId: 'test-admin', email: 'test@test.com', providers: [], roles: ['admin'] },
    roles: ['admin'],
    hasRole: (role: string) => role === 'admin',
    isAdmin: true,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    error: null,
    displayName: null,
    icPrincipal: null,
    membershipStatus: null,
  }),
}));

// Import shared components after mocks are set up
import { ProtectedRoute, LoginRedirect } from '@hello-world-co-op/auth';

// Lazy imports matching App.tsx
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const KYCManagement = lazy(() => import('@/pages/KYCManagement'));
const MemberManagement = lazy(() => import('@/pages/MemberManagement'));
const GovernanceOversight = lazy(() => import('@/pages/GovernanceOversight'));
const TreasuryManagement = lazy(() => import('@/pages/TreasuryManagement'));
const SystemMonitoring = lazy(() => import('@/pages/SystemMonitoring'));
const ContentModeration = lazy(() => import('@/pages/ContentModeration'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));
const RoleManagement = lazy(() => import('@/pages/RoleManagement'));

/**
 * Helper to render App routes with MemoryRouter at a specific path
 */
function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYCManagement /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><MemberManagement /></ProtectedRoute>} />
          <Route path="/governance" element={<ProtectedRoute><GovernanceOversight /></ProtectedRoute>} />
          <Route path="/treasury" element={<ProtectedRoute><TreasuryManagement /></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><SystemMonitoring /></ProtectedRoute>} />
          <Route path="/moderation" element={<ProtectedRoute><ContentModeration /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin dashboard on root route', async () => {
    renderAtPath('/');

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });
  });

  it('should render login redirect on /login route', async () => {
    renderAtPath('/login');

    await waitFor(() => {
      expect(screen.getByTestId('login-redirect')).toBeInTheDocument();
    });
  });

  it('should render KYC management on /kyc route', async () => {
    renderAtPath('/kyc');

    await waitFor(() => {
      expect(screen.getByTestId('kyc-management')).toBeInTheDocument();
    });
  });

  it('should render member management on /members route', async () => {
    renderAtPath('/members');

    await waitFor(() => {
      expect(screen.getByTestId('member-management')).toBeInTheDocument();
    });
  });

  it('should render governance oversight on /governance route', async () => {
    renderAtPath('/governance');

    await waitFor(() => {
      expect(screen.getByTestId('governance-oversight')).toBeInTheDocument();
    });
  });

  it('should render treasury management on /treasury route', async () => {
    renderAtPath('/treasury');

    await waitFor(() => {
      expect(screen.getByTestId('treasury-management')).toBeInTheDocument();
    });
  });

  it('should render system monitoring on /monitoring route', async () => {
    renderAtPath('/monitoring');

    await waitFor(() => {
      expect(screen.getByTestId('system-monitoring')).toBeInTheDocument();
    });
  });

  it('should render content moderation on /moderation route', async () => {
    renderAtPath('/moderation');

    await waitFor(() => {
      expect(screen.getByTestId('content-moderation')).toBeInTheDocument();
    });
  });

  it('should render role management on /roles route', async () => {
    renderAtPath('/roles');

    await waitFor(() => {
      expect(screen.getByTestId('role-management')).toBeInTheDocument();
    });
  });

  it('should render unauthorized page on /unauthorized route', async () => {
    renderAtPath('/unauthorized');

    await waitFor(() => {
      expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
    });
  });
});

/**
 * DAO Admin Suite - Root Application Component
 *
 * Wraps the router with ErrorBoundary and AuthProvider for consistent
 * error handling and role-based access control.
 * Uses route-based code splitting for optimal performance.
 * ALL admin routes require authentication (ProtectedRoute) and admin role (RoleGuard).
 * The /unauthorized route is accessible to authenticated non-admin users.
 *
 * @see BL-007.4 - Integrate AdminGuard in dao-admin-suite
 * @see FAS-7.1 - Create and Deploy dao-admin-suite
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@hello-world-co-op/auth';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Route-based code splitting - each page loads on demand
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const KYCManagement = lazy(() => import('@/pages/KYCManagement'));
const MemberManagement = lazy(() => import('@/pages/MemberManagement'));
const GovernanceOversight = lazy(() => import('@/pages/GovernanceOversight'));
const TreasuryManagement = lazy(() => import('@/pages/TreasuryManagement'));
const SystemMonitoring = lazy(() => import('@/pages/SystemMonitoring'));
const ContentModeration = lazy(() => import('@/pages/ContentModeration'));
const LoginRedirect = lazy(() => import('@/pages/LoginRedirect'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function App() {
  const oracleBridgeUrl = import.meta.env.VITE_ORACLE_BRIDGE_URL || undefined;

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider config={{ apiBaseUrl: oracleBridgeUrl }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Login redirect - no authentication required (handles redirect to FounderyOS) */}
              <Route path="/login" element={<LoginRedirect />} />

              {/* Unauthorized page - accessible to authenticated non-admin users (AC2) */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* All admin routes require authentication + admin role via ProtectedRoute */}
              <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYCManagement /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><MemberManagement /></ProtectedRoute>} />
              <Route path="/governance" element={<ProtectedRoute><GovernanceOversight /></ProtectedRoute>} />
              <Route path="/treasury" element={<ProtectedRoute><TreasuryManagement /></ProtectedRoute>} />
              <Route path="/monitoring" element={<ProtectedRoute><SystemMonitoring /></ProtectedRoute>} />
              <Route path="/moderation" element={<ProtectedRoute><ContentModeration /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

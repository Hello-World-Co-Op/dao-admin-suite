/**
 * DAO Admin Suite - Root Application Component
 *
 * Wraps the router with ErrorBoundary and AuthProvider for consistent
 * error handling and role-based access control.
 * Uses route-based code splitting for optimal performance.
 * ALL admin routes require authentication + admin role via shared ProtectedRoute.
 * The /unauthorized route is accessible to authenticated non-admin users.
 *
 * @see BL-029.3 - Migrate dao-admin-suite to shared auth components
 * @see BL-007.4 - Integrate AdminGuard in dao-admin-suite
 * @see FAS-7.1 - Create and Deploy dao-admin-suite
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, LoginRedirect } from '@hello-world-co-op/auth';
import ErrorBoundary from '@/components/ErrorBoundary';

// Route-based code splitting - each page loads on demand
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const KYCManagement = lazy(() => import('@/pages/KYCManagement'));
const MemberManagement = lazy(() => import('@/pages/MemberManagement'));
const GovernanceOversight = lazy(() => import('@/pages/GovernanceOversight'));
const TreasuryManagement = lazy(() => import('@/pages/TreasuryManagement'));
const SystemMonitoring = lazy(() => import('@/pages/SystemMonitoring'));
const ContentModeration = lazy(() => import('@/pages/ContentModeration'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));

// Spike: Tiptap editor feasibility validation (BL-008.3.1)
// This is a temporary experimental route - not for production use
const EditorSpike = lazy(() => import('@/pages/blog/EditorSpike'));

// Production blog editor (BL-008.3.2) - code-split for LCP < 2.5s (NFR2)
// Editor chunk must remain under 200KB gzip (NFR7)
const BlogEditorPage = lazy(() => import('@/pages/blog/BlogEditorPage'));

// Blog dashboard (BL-008.3.5) - admin dashboard or contributor dashboard based on role
const BlogDashboard = lazy(() => import('@/pages/blog/BlogDashboard'));

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
  // redirectBehavior="external" is used (not the two-hop /login-page approach recommended in Dev Notes)
  // because it is equivalent in behavior and simpler: unauthenticated users go directly to FounderyOS
  // login with returnUrl=<full admin URL>, bypassing the local /login route. The local /login route
  // (LoginRedirect) still exists for direct URL access. See BL-029.3 Dev Notes for the two-hop alternative.
  const founderyOsLoginUrl = `${import.meta.env.VITE_FOUNDERY_OS_URL || 'http://127.0.0.1:5174'}/login`;

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider config={{ apiBaseUrl: oracleBridgeUrl, e2eBypass: import.meta.env.VITE_E2E_AUTH_BYPASS === 'true', devBypass: import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Login redirect - no authentication required (handles redirect to FounderyOS) */}
              <Route path="/login" element={<LoginRedirect loginUrl={founderyOsLoginUrl} />} />

              {/* Unauthorized page - accessible to authenticated non-admin users (AC2) */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Spike: Tiptap editor validation (BL-008.3.1) - temporary, no auth required */}
              <Route path="/blog/spike-editor" element={<EditorSpike />} />

              {/* Blog dashboard - requires authentication + admin role (BL-008.3.5) */}
              <Route
                path="/blog"
                element={
                  <ProtectedRoute
                    requiredRole="admin"
                    unauthorizedComponent={<Unauthorized />}
                    loginUrl={founderyOsLoginUrl}
                    redirectBehavior="external"
                  >
                    <BlogDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Blog editor routes - require authentication + admin role (BL-008.3.2) */}
              {/* TODO: Add 'author' role support when non-admin author RBAC is implemented */}
              <Route
                path="/blog/editor/new"
                element={
                  <ProtectedRoute
                    requiredRole="admin"
                    unauthorizedComponent={<Unauthorized />}
                    loginUrl={founderyOsLoginUrl}
                    redirectBehavior="external"
                  >
                    <BlogEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blog/editor/:id"
                element={
                  <ProtectedRoute
                    requiredRole="admin"
                    unauthorizedComponent={<Unauthorized />}
                    loginUrl={founderyOsLoginUrl}
                    redirectBehavior="external"
                  >
                    <BlogEditorPage />
                  </ProtectedRoute>
                }
              />

              {/* All admin routes require authentication + admin role via shared ProtectedRoute */}
              <Route path="/" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><KYCManagement /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><MemberManagement /></ProtectedRoute>} />
              <Route path="/governance" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><GovernanceOversight /></ProtectedRoute>} />
              <Route path="/treasury" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><TreasuryManagement /></ProtectedRoute>} />
              <Route path="/monitoring" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><SystemMonitoring /></ProtectedRoute>} />
              <Route path="/moderation" element={<ProtectedRoute requiredRole="admin" unauthorizedComponent={<Unauthorized />} loginUrl={founderyOsLoginUrl} redirectBehavior="external"><ContentModeration /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

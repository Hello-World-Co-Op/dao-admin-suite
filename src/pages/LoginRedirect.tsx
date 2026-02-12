/**
 * LoginRedirect Page
 *
 * The dao-admin-suite does not have its own login flow - authentication is
 * handled by the FounderyOS suite. This page redirects users to the
 * FounderyOS login page, preserving the return URL so they can be
 * sent back after authentication.
 *
 * FAS-8.1: Before redirecting, checks for an existing cookie-based
 * session (cross-suite SSO). If the user is already authenticated
 * via shared httpOnly cookies, navigates directly without leaving.
 *
 * Security: Uses location.state.from from ProtectedRoute to get the
 * return URL, avoiding open redirect vulnerabilities from query params.
 *
 * @see FAS-7.1 - DAO Admin Suite extraction
 * @see FAS-8.1 - Cross-suite SSO
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { validateReturnUrl } from '@/utils/validateReturnUrl';

export default function LoginRedirect() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const message = searchParams.get('message');
  const [checkingCookies, setCheckingCookies] = useState(true);

  // Get return URL from location state (set by ProtectedRoute)
  const fromLocation = location.state?.from?.pathname;
  const validatedReturnUrl = validateReturnUrl(fromLocation);

  useEffect(() => {
    const trySSO = async () => {
      // FAS-8.1: Check cookie-based session before redirecting to FounderyOS
      try {
        const baseUrl = import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
        const response = await fetch(`${baseUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.authenticated === true) {
          navigate(validatedReturnUrl, { replace: true });
          return;
        }
      } catch {
        // Cookie check failed — fall through to FounderyOS redirect
      }

      setCheckingCookies(false);
    };

    trySSO();
  }, [navigate, validatedReturnUrl]);

  useEffect(() => {
    if (checkingCookies) return;

    // Build the FounderyOS login URL with returnUrl pointing back to admin-suite
    const founderyOsUrl =
      import.meta.env.VITE_FOUNDERY_OS_URL || 'http://127.0.0.1:5174';

    const loginUrl = new URL('/login', founderyOsUrl);

    // Pass the admin-suite return URL so FounderyOS can redirect back after login
    const adminSuiteOrigin = window.location.origin;
    loginUrl.searchParams.set('returnUrl', `${adminSuiteOrigin}${validatedReturnUrl}`);

    if (message) {
      loginUrl.searchParams.set('message', message);
    }

    window.location.href = loginUrl.toString();
  }, [checkingCookies, message, validatedReturnUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to login...</p>
        {message && (
          <p className="text-sm text-gray-500 mt-2 max-w-md">{message}</p>
        )}
      </div>
    </div>
  );
}

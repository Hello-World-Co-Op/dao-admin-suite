/**
 * Unauthorized Page Tests
 *
 * Tests for the unauthorized access page displayed to authenticated
 * users who lack admin role.
 *
 * @see BL-029.3 - Migrate dao-admin-suite to shared auth components
 * @see BL-007.4 AC2 - Non-admin users see /unauthorized page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockLogout = vi.fn();

// Mock @hello-world-co-op/auth to provide logout via useAuth
vi.mock('@hello-world-co-op/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { userId: 'test-user', email: 'test@test.com', providers: [], roles: [] },
    roles: [],
    hasRole: () => false,
    isAdmin: false,
    login: vi.fn(),
    logout: mockLogout,
    refresh: vi.fn(),
    error: null,
    displayName: null,
    icPrincipal: null,
    membershipStatus: null,
  }),
}));

import Unauthorized from './Unauthorized';

function renderUnauthorized() {
  return render(
    <MemoryRouter>
      <Unauthorized />
    </MemoryRouter>
  );
}

describe('Unauthorized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "Admin Access Required" heading', () => {
    renderUnauthorized();
    expect(screen.getByText('Admin Access Required')).toBeInTheDocument();
  });

  it('should render descriptive message about permissions', () => {
    renderUnauthorized();
    expect(
      screen.getByText(/don't have the required permissions/)
    ).toBeInTheDocument();
  });

  it('should render "Go to Portal" link', () => {
    renderUnauthorized();
    const portalLink = screen.getByText('Go to Portal');
    expect(portalLink).toBeInTheDocument();
    expect(portalLink.closest('a')).toHaveAttribute('href');
  });

  it('should render "Sign Out" button', () => {
    renderUnauthorized();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should call logout when "Sign Out" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthorized();

    await user.click(screen.getByText('Sign Out'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should use default portal URL when env var is not set', () => {
    renderUnauthorized();
    const portalLink = screen.getByText('Go to Portal').closest('a');
    expect(portalLink).toHaveAttribute(
      'href',
      'https://portal.helloworlddao.com'
    );
  });

  it('should render the shield icon', () => {
    renderUnauthorized();
    // ShieldX from lucide-react renders as an SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

/**
 * Tests for PersistentBanner component
 *
 * Story BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 *
 * Validates:
 * - Banner visibility controlled by visible prop (AC4)
 * - Displays StaleEdit message (AC4)
 * - Reload button triggers page reload (AC4)
 * - Has role="alert" for accessibility (AC4)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.4 AC4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersistentBanner } from './PersistentBanner';

describe('PersistentBanner', () => {
  it('renders nothing when visible is false', () => {
    render(<PersistentBanner visible={false} message="Test message" />);

    expect(screen.queryByTestId('persistent-banner')).not.toBeInTheDocument();
  });

  it('renders banner when visible is true', () => {
    render(<PersistentBanner visible={true} message="This post was modified in another session. Reload to see latest changes." />);

    const banner = screen.getByTestId('persistent-banner');
    expect(banner).toBeInTheDocument();
  });

  it('displays the StaleEdit message text', () => {
    render(<PersistentBanner visible={true} message="This post was modified in another session. Reload to see latest changes." />);

    expect(screen.getByText('This post was modified in another session. Reload to see latest changes.')).toBeInTheDocument();
  });

  it('has role="alert" for screen reader announcement', () => {
    render(<PersistentBanner visible={true} message="Test message" />);

    expect(screen.getByTestId('persistent-banner')).toHaveAttribute('role', 'alert');
  });

  it('shows Reload button', () => {
    render(<PersistentBanner visible={true} message="Test message" />);

    const reloadButton = screen.getByTestId('persistent-banner-reload');
    expect(reloadButton).toBeInTheDocument();
    expect(reloadButton).toHaveTextContent('Reload');
  });

  it('calls window.location.reload when Reload button is clicked', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: mockReload },
    });

    render(<PersistentBanner visible={true} message="Test message" />);

    fireEvent.click(screen.getByTestId('persistent-banner-reload'));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});

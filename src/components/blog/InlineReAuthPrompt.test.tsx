/**
 * Tests for InlineReAuthPrompt component
 *
 * Story BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 *
 * Validates:
 * - Prompt visibility controlled by visible prop (AC8)
 * - Shows session expired message (AC8)
 * - Re-authenticate button calls onReAuth (AC8)
 * - Dismiss button calls onDismiss (AC8)
 * - Has role="alert" for accessibility (AC8)
 * - Content is preserved (editor never navigated away) (AC8)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.4 AC8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineReAuthPrompt } from './InlineReAuthPrompt';

describe('InlineReAuthPrompt', () => {
  it('renders nothing when visible is false', () => {
    render(<InlineReAuthPrompt visible={false} onReAuth={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('reauth-prompt')).not.toBeInTheDocument();
  });

  it('renders prompt when visible is true', () => {
    render(<InlineReAuthPrompt visible={true} onReAuth={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('reauth-prompt')).toBeInTheDocument();
  });

  it('displays "Your session has expired" message', () => {
    render(<InlineReAuthPrompt visible={true} onReAuth={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText('Your session has expired')).toBeInTheDocument();
  });

  it('displays content preservation message', () => {
    render(<InlineReAuthPrompt visible={true} onReAuth={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText('Your content is safe. Please re-authenticate to continue saving.')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<InlineReAuthPrompt visible={true} onReAuth={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('reauth-prompt')).toHaveAttribute('role', 'alert');
  });

  it('Re-authenticate button calls onReAuth', () => {
    const onReAuth = vi.fn();
    render(<InlineReAuthPrompt visible={true} onReAuth={onReAuth} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByTestId('reauth-button'));
    expect(onReAuth).toHaveBeenCalledTimes(1);
  });

  it('Dismiss button calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(<InlineReAuthPrompt visible={true} onReAuth={vi.fn()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('reauth-dismiss-button'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('prompt is inline (not a modal) - renders as a div, not dialog', () => {
    render(<InlineReAuthPrompt visible={true} onReAuth={vi.fn()} onDismiss={vi.fn()} />);

    const prompt = screen.getByTestId('reauth-prompt');
    expect(prompt.tagName).toBe('DIV');
    expect(prompt).not.toHaveAttribute('role', 'dialog');
  });
});

/**
 * Tests for RecoveryPrompt component and recovery utilities
 *
 * Story BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 *
 * Validates:
 * - RecoveryPrompt visibility (AC7)
 * - Recover button calls onRecover (AC7)
 * - Discard button calls onDiscard (AC7)
 * - normalizeICTimestamp converts nanoseconds to milliseconds (AC6)
 * - checkForRecovery detects newer localStorage backup (AC7)
 * - 5-second tolerance window suppresses recovery prompt (AC7)
 * - clearBackup removes localStorage entry (AC7)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.4 AC6, AC7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecoveryPrompt } from './RecoveryPrompt';
import {
  normalizeICTimestamp,
  checkForRecovery,
  clearBackup,
  RECOVERY_TOLERANCE_MS,
} from '@/utils/recovery';

describe('RecoveryPrompt component', () => {
  it('renders nothing when visible is false', () => {
    render(<RecoveryPrompt visible={false} onRecover={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.queryByTestId('recovery-prompt')).not.toBeInTheDocument();
  });

  it('renders prompt when visible is true', () => {
    render(<RecoveryPrompt visible={true} onRecover={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByTestId('recovery-prompt')).toBeInTheDocument();
  });

  it('displays "Recover unsaved changes?" text', () => {
    render(<RecoveryPrompt visible={true} onRecover={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByText('Recover unsaved changes?')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<RecoveryPrompt visible={true} onRecover={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByTestId('recovery-prompt')).toHaveAttribute('role', 'alert');
  });

  it('Recover button calls onRecover', () => {
    const onRecover = vi.fn();
    render(<RecoveryPrompt visible={true} onRecover={onRecover} onDiscard={vi.fn()} />);

    fireEvent.click(screen.getByTestId('recovery-recover-button'));
    expect(onRecover).toHaveBeenCalledTimes(1);
  });

  it('Discard button calls onDiscard', () => {
    const onDiscard = vi.fn();
    render(<RecoveryPrompt visible={true} onRecover={vi.fn()} onDiscard={onDiscard} />);

    fireEvent.click(screen.getByTestId('recovery-discard-button'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

describe('normalizeICTimestamp', () => {
  it('converts IC nanoseconds to JavaScript milliseconds', () => {
    // 1_707_800_000_000_000_000 nanoseconds = 1_707_800_000_000 milliseconds
    expect(normalizeICTimestamp(1_707_800_000_000_000_000)).toBe(1_707_800_000_000);
  });

  it('handles zero', () => {
    expect(normalizeICTimestamp(0)).toBe(0);
  });

  it('floors the result (no fractional milliseconds)', () => {
    // 1_500_000 nanoseconds = 1.5 milliseconds -> floor to 1
    expect(normalizeICTimestamp(1_500_000)).toBe(1);
  });

  it('converts a typical IC timestamp correctly', () => {
    // Example: Feb 13, 2024 ~12:00 UTC in nanoseconds
    const icTimestamp = 1_707_825_600_000_000_000;
    const expectedMs = 1_707_825_600_000;
    expect(normalizeICTimestamp(icTimestamp)).toBe(expectedMs);
  });
});

describe('checkForRecovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no localStorage backup exists', () => {
    expect(checkForRecovery(42, 1_000_000_000_000_000)).toBeNull();
  });

  it('returns null when localStorage has invalid JSON', () => {
    localStorage.setItem('blog-draft-backup-42', 'not-json');
    expect(checkForRecovery(42, 1_000_000_000_000_000)).toBeNull();
  });

  it('returns null when backup has no body', () => {
    localStorage.setItem('blog-draft-backup-42', JSON.stringify({ timestamp: Date.now() }));
    expect(checkForRecovery(42, 1_000_000_000_000_000)).toBeNull();
  });

  it('returns null when backup has no timestamp', () => {
    localStorage.setItem('blog-draft-backup-42', JSON.stringify({ body: '<p>test</p>' }));
    expect(checkForRecovery(42, 1_000_000_000_000_000)).toBeNull();
  });

  it('returns backup when localStorage is newer by more than tolerance', () => {
    const canisterNs = 1_700_000_000_000_000_000; // 1_700_000_000_000 ms
    const localMs = 1_700_000_010_000; // 10 seconds newer (> 5s tolerance)

    localStorage.setItem('blog-draft-backup-42', JSON.stringify({
      body: '<p>recovered content</p>',
      timestamp: localMs,
    }));

    const result = checkForRecovery(42, canisterNs);
    expect(result).not.toBeNull();
    expect(result?.body).toBe('<p>recovered content</p>');
    expect(result?.timestamp).toBe(localMs);
  });

  it('returns null when timestamps are within 5-second tolerance', () => {
    const canisterNs = 1_700_000_000_000_000_000; // 1_700_000_000_000 ms
    const localMs = 1_700_000_003_000; // 3 seconds newer (< 5s tolerance)

    localStorage.setItem('blog-draft-backup-42', JSON.stringify({
      body: '<p>same save</p>',
      timestamp: localMs,
    }));

    expect(checkForRecovery(42, canisterNs)).toBeNull();
  });

  it('returns null when localStorage backup is older', () => {
    const canisterNs = 1_700_000_010_000_000_000; // 1_700_000_010_000 ms
    const localMs = 1_700_000_000_000; // 10 seconds older

    localStorage.setItem('blog-draft-backup-42', JSON.stringify({
      body: '<p>old content</p>',
      timestamp: localMs,
    }));

    expect(checkForRecovery(42, canisterNs)).toBeNull();
  });

  it('uses RECOVERY_TOLERANCE_MS = 5000', () => {
    expect(RECOVERY_TOLERANCE_MS).toBe(5_000);
  });
});

describe('clearBackup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes localStorage backup for the given postId', () => {
    localStorage.setItem('blog-draft-backup-42', JSON.stringify({ body: 'test', timestamp: 1000 }));
    clearBackup(42);
    expect(localStorage.getItem('blog-draft-backup-42')).toBeNull();
  });

  it('does not throw when backup does not exist', () => {
    expect(() => clearBackup(999)).not.toThrow();
  });
});

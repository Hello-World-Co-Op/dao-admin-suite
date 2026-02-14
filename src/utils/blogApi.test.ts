/**
 * Tests for blogApi utility
 *
 * Story BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 *
 * Validates:
 * - saveDraft success returns updated_at (AC3)
 * - StaleEdit (409) mapped correctly (AC4)
 * - Unauthorized (401/403) mapped correctly (AC8)
 * - PostTooLarge (413) mapped correctly
 * - InternalError for other errors
 * - NetworkError for fetch failures (AC5)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.4 AC3, AC4, AC5, AC8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveDraft } from './blogApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('saveDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success with updated_at on 200 response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updated_at: 5000 }),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result).toEqual({ success: true, updated_at: 5000 });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/blog/save-draft',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          id: 42,
          body: '<p>content</p>',
          expected_updated_at: 1000,
        }),
      }),
    );
  });

  it('returns StaleEdit error on 409 with "modified in another session"', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({
        message: 'This post was modified in another session. Reload to see latest changes.',
      }),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('StaleEdit');
    expect(result.message).toContain('modified in another session');
  });

  it('returns Unauthorized error on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Not authorized' }),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns Unauthorized error on 403', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns PostTooLarge error on 413', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 413,
      json: () => Promise.resolve({ message: 'Post content is too large.' }),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('PostTooLarge');
  });

  it('returns InternalError for other error statuses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('InternalError');
    expect(result.message).toBe('Server error');
  });

  it('returns NetworkError when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('NetworkError');
    expect(result.message).toContain('network');
  });

  it('handles JSON parse error in error response gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const result = await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(result.success).toBe(false);
    expect(result.error).toBe('InternalError');
  });

  it('sends request with credentials: include for SSO cookie', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updated_at: 5000 }),
    });

    await saveDraft('http://localhost:3000', 42, '<p>content</p>', 1000);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});

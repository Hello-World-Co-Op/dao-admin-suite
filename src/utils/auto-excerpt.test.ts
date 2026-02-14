/**
 * Auto-Excerpt Utility Tests
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 21.8: Test auto-excerpt generation utility
 */

import { describe, it, expect } from 'vitest';
import { generateAutoExcerpt } from './auto-excerpt';

describe('auto-excerpt utility', () => {
  it('returns empty string for empty input', () => {
    expect(generateAutoExcerpt('')).toBe('');
  });

  it('extracts first paragraph text', () => {
    expect(generateAutoExcerpt('<p>Hello world</p><p>Second paragraph</p>')).toBe('Hello world');
  });

  it('strips HTML tags from paragraph', () => {
    expect(generateAutoExcerpt('<p>Hello <strong>bold</strong> world</p>')).toBe('Hello bold world');
  });

  it('truncates to 300 chars with ellipsis', () => {
    const longText = 'a'.repeat(350);
    const result = generateAutoExcerpt(`<p>${longText}</p>`);
    expect(result.length).toBeLessThanOrEqual(303); // 300 + "..."
    expect(result.endsWith('...')).toBe(true);
  });

  it('does not add ellipsis for short text', () => {
    expect(generateAutoExcerpt('<p>Short text</p>')).toBe('Short text');
  });

  it('falls back to full content when no <p> tag', () => {
    expect(generateAutoExcerpt('Just plain text')).toBe('Just plain text');
  });

  it('handles paragraph with only tags (empty)', () => {
    expect(generateAutoExcerpt('<p><br></p>')).toBe('');
  });

  it('respects custom maxLength', () => {
    const result = generateAutoExcerpt('<p>Hello world this is a longer sentence</p>', 10);
    expect(result.length).toBeLessThanOrEqual(13); // 10 + "..."
  });
});

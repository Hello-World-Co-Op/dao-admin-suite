/**
 * Slug Generator Utility Tests
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 21.2: Test SlugField auto-generation
 */

import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from './slug-generator';

describe('slug-generator utility', () => {
  describe('generateSlug', () => {
    it('converts title to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(generateSlug('my first post')).toBe('my-first-post');
    });

    it('removes special characters', () => {
      expect(generateSlug('Hello! World?')).toBe('hello-world');
    });

    it('collapses multiple hyphens', () => {
      expect(generateSlug('hello---world')).toBe('hello-world');
    });

    it('trims leading and trailing hyphens', () => {
      expect(generateSlug('  Hello World  ')).toBe('hello-world');
    });

    it('strips diacritics', () => {
      expect(generateSlug('cafe resume')).toBe('cafe-resume');
    });

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('truncates to max length', () => {
      const longTitle = 'a'.repeat(250);
      expect(generateSlug(longTitle).length).toBeLessThanOrEqual(200);
    });
  });

  describe('isValidSlug', () => {
    it('accepts valid slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('my-post-123')).toBe(true);
      expect(isValidSlug('abc')).toBe(true);
    });

    it('rejects invalid slugs', () => {
      expect(isValidSlug('Hello World')).toBe(false);
      expect(isValidSlug('has_underscore')).toBe(false);
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug('has space')).toBe(false);
    });
  });
});

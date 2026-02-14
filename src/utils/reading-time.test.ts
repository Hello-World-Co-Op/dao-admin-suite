/**
 * Reading Time Utility Tests
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 21.7: Test reading time calculation utility
 */

import { describe, it, expect } from 'vitest';
import { stripHtml, countWords, calculateReadingTime } from './reading-time';

describe('reading-time utility', () => {
  describe('stripHtml', () => {
    it('removes HTML tags from content', () => {
      expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(stripHtml('')).toBe('');
    });

    it('handles nested tags', () => {
      expect(stripHtml('<div><p><span>text</span></p></div>')).toBe('text');
    });
  });

  describe('countWords', () => {
    it('counts words in HTML content', () => {
      expect(countWords('<p>Hello world foo bar</p>')).toBe(4);
    });

    it('returns 0 for empty content', () => {
      expect(countWords('')).toBe(0);
    });

    it('returns 0 for HTML-only content', () => {
      expect(countWords('<p></p><br/>')).toBe(0);
    });

    it('handles multiple tags and whitespace', () => {
      expect(countWords('<p>One</p><p>Two three</p>')).toBe(3);
    });
  });

  describe('calculateReadingTime', () => {
    it('returns 0 for empty content', () => {
      expect(calculateReadingTime('')).toBe(0);
    });

    it('returns 1 minute for 1-200 words', () => {
      const words = Array(100).fill('word').join(' ');
      expect(calculateReadingTime(`<p>${words}</p>`)).toBe(1);
    });

    it('returns 2 minutes for 201-400 words', () => {
      const words = Array(300).fill('word').join(' ');
      expect(calculateReadingTime(`<p>${words}</p>`)).toBe(2);
    });

    it('calculates correctly with Math.ceil', () => {
      const words = Array(201).fill('word').join(' ');
      expect(calculateReadingTime(`<p>${words}</p>`)).toBe(2);
    });

    it('returns 1 minute for exactly 200 words', () => {
      const words = Array(200).fill('word').join(' ');
      expect(calculateReadingTime(`<p>${words}</p>`)).toBe(1);
    });
  });
});

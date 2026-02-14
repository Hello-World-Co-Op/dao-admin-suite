/**
 * Tests for OG Image Utilities
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Validates:
 * - findAutoOGCandidate correctly identifies first image >= 600px (AC3)
 * - extractImageUrls extracts all image URLs from HTML (AC3)
 * - calculateDefaultCrop produces correct crop area for OG aspect ratio (AC2)
 * - isOGEligible validates image width (AC3)
 * - Edge cases: empty HTML, no images, images without width
 *
 * @see AC2 - OG image crop at 1200x630
 * @see AC3 - Auto-OG detection
 */

import { describe, it, expect } from 'vitest';
import {
  findAutoOGCandidate,
  extractImageUrls,
  calculateDefaultCrop,
  isOGEligible,
  OG_WIDTH,
  OG_HEIGHT,
  OG_ASPECT_RATIO,
  MIN_AUTO_OG_WIDTH,
} from './ogImageUtils';

describe('ogImageUtils', () => {
  describe('constants', () => {
    it('OG dimensions are 1200x630', () => {
      expect(OG_WIDTH).toBe(1200);
      expect(OG_HEIGHT).toBe(630);
    });

    it('OG aspect ratio is approximately 1.905', () => {
      expect(OG_ASPECT_RATIO).toBeCloseTo(1.905, 2);
    });

    it('minimum auto-OG width is 600px', () => {
      expect(MIN_AUTO_OG_WIDTH).toBe(600);
    });
  });

  describe('findAutoOGCandidate', () => {
    it('returns null for empty HTML', () => {
      expect(findAutoOGCandidate('')).toBeNull();
    });

    it('returns null for HTML with no images', () => {
      expect(findAutoOGCandidate('<p>No images here</p>')).toBeNull();
    });

    it('returns first image with width >= 600', () => {
      const html = '<p>Text</p><img src="https://example.com/small.jpg" width="400"><img src="https://example.com/big.jpg" width="800">';
      expect(findAutoOGCandidate(html)).toBe('https://example.com/big.jpg');
    });

    it('returns first image when no width attribute is present (candidate for dimension check)', () => {
      const html = '<p>Text</p><img src="https://example.com/unknown.jpg">';
      expect(findAutoOGCandidate(html)).toBe('https://example.com/unknown.jpg');
    });

    it('skips images with width < 600 when width attribute is present', () => {
      const html = '<img src="https://example.com/tiny.jpg" width="200"><img src="https://example.com/tiny2.jpg" width="300">';
      expect(findAutoOGCandidate(html)).toBeNull();
    });

    it('returns first eligible image when multiple images >= 600', () => {
      const html = '<img src="https://example.com/first.jpg" width="700"><img src="https://example.com/second.jpg" width="900">';
      expect(findAutoOGCandidate(html)).toBe('https://example.com/first.jpg');
    });

    it('returns null for null input', () => {
      expect(findAutoOGCandidate(null as unknown as string)).toBeNull();
    });
  });

  describe('extractImageUrls', () => {
    it('returns empty array for empty HTML', () => {
      expect(extractImageUrls('')).toEqual([]);
    });

    it('returns empty array for HTML without images', () => {
      expect(extractImageUrls('<p>No images</p>')).toEqual([]);
    });

    it('extracts all image URLs', () => {
      const html = '<img src="https://a.jpg"><p>text</p><img src="https://b.jpg"><img src="https://c.jpg">';
      expect(extractImageUrls(html)).toEqual(['https://a.jpg', 'https://b.jpg', 'https://c.jpg']);
    });

    it('ignores images without src attribute', () => {
      const html = '<img alt="no src"><img src="https://valid.jpg">';
      expect(extractImageUrls(html)).toEqual(['https://valid.jpg']);
    });
  });

  describe('isOGEligible', () => {
    it('returns true for width >= 600', () => {
      expect(isOGEligible(600)).toBe(true);
      expect(isOGEligible(800)).toBe(true);
      expect(isOGEligible(1200)).toBe(true);
    });

    it('returns false for width < 600', () => {
      expect(isOGEligible(599)).toBe(false);
      expect(isOGEligible(400)).toBe(false);
      expect(isOGEligible(0)).toBe(false);
    });
  });

  describe('calculateDefaultCrop', () => {
    it('returns full crop for image with exact OG aspect ratio', () => {
      const crop = calculateDefaultCrop(1200, 630);
      expect(crop.x).toBeCloseTo(0, 0);
      expect(crop.y).toBeCloseTo(0, 0);
      expect(crop.width).toBeCloseTo(100, 0);
      expect(crop.height).toBeCloseTo(100, 0);
    });

    it('crops width for landscape image wider than OG ratio', () => {
      // 2400x630 is much wider than 1200:630
      const crop = calculateDefaultCrop(2400, 630);
      expect(crop.width).toBeLessThan(100);
      expect(crop.height).toBe(100);
      expect(crop.x).toBeGreaterThan(0);
      expect(crop.y).toBe(0);
    });

    it('crops height for portrait image', () => {
      // 600x1200 is much taller than 1200:630
      const crop = calculateDefaultCrop(600, 1200);
      expect(crop.width).toBe(100);
      expect(crop.height).toBeLessThan(100);
      expect(crop.x).toBe(0);
      expect(crop.y).toBeGreaterThan(0);
    });

    it('centers the crop area', () => {
      // For a wider image, x should be centered
      const crop = calculateDefaultCrop(2400, 630);
      expect(crop.x).toBeCloseTo((100 - crop.width) / 2, 1);
    });

    it('crop area percentages sum correctly', () => {
      const crop = calculateDefaultCrop(1600, 900);
      expect(crop.x + crop.width).toBeLessThanOrEqual(100.01);
      expect(crop.y + crop.height).toBeLessThanOrEqual(100.01);
    });
  });
});

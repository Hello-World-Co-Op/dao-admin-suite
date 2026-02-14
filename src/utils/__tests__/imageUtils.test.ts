/**
 * Tests for imageUtils.ts
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 *
 * @see AC1 - Image resized client-side to max 1200px width
 * @see AC5 - 30-second timeout with retry
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  compressImage,
  uploadWithTimeout,
  isValidImageType,
  SUPPORTED_IMAGE_TYPES,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_SIZE_MB,
  UPLOAD_TIMEOUT_MS,
} from '../imageUtils';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

import imageCompression from 'browser-image-compression';

const mockedCompression = vi.mocked(imageCompression);

/** Create a mock File object */
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

describe('imageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidImageType', () => {
    it('accepts JPEG files', () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
      expect(isValidImageType(file)).toBe(true);
    });

    it('accepts PNG files', () => {
      const file = createMockFile('screenshot.png', 1024, 'image/png');
      expect(isValidImageType(file)).toBe(true);
    });

    it('accepts GIF files', () => {
      const file = createMockFile('animation.gif', 1024, 'image/gif');
      expect(isValidImageType(file)).toBe(true);
    });

    it('accepts WebP files', () => {
      const file = createMockFile('modern.webp', 1024, 'image/webp');
      expect(isValidImageType(file)).toBe(true);
    });

    it('rejects SVG files (XSS prevention)', () => {
      const file = createMockFile('icon.svg', 1024, 'image/svg+xml');
      expect(isValidImageType(file)).toBe(false);
    });

    it('rejects non-image files', () => {
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');
      expect(isValidImageType(file)).toBe(false);
    });
  });

  describe('compressImage', () => {
    it('calls browser-image-compression with correct options', async () => {
      const inputFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg');
      const compressedFile = createMockFile('compressed.jpg', 1024 * 1024, 'image/jpeg');

      mockedCompression.mockResolvedValue(compressedFile);

      const result = await compressImage(inputFile);

      expect(mockedCompression).toHaveBeenCalledWith(inputFile, {
        maxWidthOrHeight: MAX_IMAGE_WIDTH,
        maxSizeMB: MAX_IMAGE_SIZE_MB,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });

      expect(result).toBe(compressedFile);
    });

    it('uses default max width of 1200px', async () => {
      const inputFile = createMockFile('photo.png', 5 * 1024 * 1024, 'image/png');
      const compressedFile = createMockFile('compressed.png', 1024 * 1024, 'image/png');

      mockedCompression.mockResolvedValue(compressedFile);

      await compressImage(inputFile);

      expect(mockedCompression).toHaveBeenCalledWith(
        inputFile,
        expect.objectContaining({ maxWidthOrHeight: 1200 })
      );
    });

    it('allows custom max width', async () => {
      const inputFile = createMockFile('photo.png', 5 * 1024 * 1024, 'image/png');
      const compressedFile = createMockFile('compressed.png', 1024 * 1024, 'image/png');

      mockedCompression.mockResolvedValue(compressedFile);

      await compressImage(inputFile, 800);

      expect(mockedCompression).toHaveBeenCalledWith(
        inputFile,
        expect.objectContaining({ maxWidthOrHeight: 800 })
      );
    });

    it('preserves original MIME type', async () => {
      const pngFile = createMockFile('screenshot.png', 3 * 1024 * 1024, 'image/png');
      const compressedFile = createMockFile('compressed.png', 1024 * 1024, 'image/png');

      mockedCompression.mockResolvedValue(compressedFile);

      await compressImage(pngFile);

      expect(mockedCompression).toHaveBeenCalledWith(
        pngFile,
        expect.objectContaining({ fileType: 'image/png' })
      );
    });

    it('enables Web Worker for non-blocking compression', async () => {
      const inputFile = createMockFile('photo.jpg', 10 * 1024 * 1024, 'image/jpeg');
      const compressedFile = createMockFile('compressed.jpg', 1024 * 1024, 'image/jpeg');

      mockedCompression.mockResolvedValue(compressedFile);

      await compressImage(inputFile);

      expect(mockedCompression).toHaveBeenCalledWith(
        inputFile,
        expect.objectContaining({ useWebWorker: true })
      );
    });

    it('propagates compression errors', async () => {
      const inputFile = createMockFile('corrupt.jpg', 1024, 'image/jpeg');

      mockedCompression.mockRejectedValue(new Error('Invalid image'));

      await expect(compressImage(inputFile)).rejects.toThrow('Invalid image');
    });
  });

  describe('uploadWithTimeout', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      global.fetch = fetchSpy;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('uploads successfully within timeout', async () => {
      const mockResponse = new Response(JSON.stringify({ url: 'https://example.com/img.jpg' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      fetchSpy.mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('image', createMockFile('photo.jpg', 1024, 'image/jpeg'));

      const responsePromise = uploadWithTimeout('https://api.example.com/upload', formData);

      // Fast-forward any pending timers
      await vi.advanceTimersByTimeAsync(0);

      const response = await responsePromise;
      expect(response.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('throws on timeout after specified duration', async () => {
      vi.useRealTimers(); // Use real timers for this test to avoid fake timer issues

      // Create a fetch that takes longer than the timeout
      fetchSpy.mockImplementation(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          })
      );

      const formData = new FormData();
      formData.append('image', createMockFile('photo.jpg', 1024, 'image/jpeg'));

      // Use a very short timeout (50ms) so we don't wait long
      await expect(
        uploadWithTimeout('https://api.example.com/upload', formData, 50)
      ).rejects.toThrow('Upload timed out after 30 seconds');
    });

    it('uses default 30-second timeout', () => {
      expect(UPLOAD_TIMEOUT_MS).toBe(30_000);
    });
  });

  describe('constants', () => {
    it('has correct supported image types', () => {
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/jpeg');
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/png');
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/gif');
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/webp');
      expect(SUPPORTED_IMAGE_TYPES).not.toContain('image/svg+xml');
    });

    it('has max width of 1200px', () => {
      expect(MAX_IMAGE_WIDTH).toBe(1200);
    });

    it('has max size of 2MB', () => {
      expect(MAX_IMAGE_SIZE_MB).toBe(2);
    });
  });
});

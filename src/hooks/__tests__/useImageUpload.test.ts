/**
 * Tests for useImageUpload hook
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 *
 * @see AC1 - Image compression before upload
 * @see AC2 - Sequential upload queue with aggregate progress
 * @see AC5 - Retry on timeout/network error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from '../useImageUpload';

// Mock imageUtils
vi.mock('@/utils/imageUtils', () => ({
  compressImage: vi.fn(),
  uploadWithTimeout: vi.fn(),
  isValidImageType: vi.fn(),
}));

import { compressImage, uploadWithTimeout, isValidImageType } from '@/utils/imageUtils';

const mockedCompressImage = vi.mocked(compressImage);
const mockedUploadWithTimeout = vi.mocked(uploadWithTimeout);
const mockedIsValidImageType = vi.mocked(isValidImageType);

/** Create a mock File object */
function createMockFile(name: string, size: number, type: string): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

describe('useImageUpload', () => {
  const oracleBridgeUrl = 'https://oracle.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsValidImageType.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty queue', () => {
    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    expect(result.current.queue).toEqual([]);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.statusMessage).toBe('');
  });

  it('adds files to the upload queue', () => {
    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const file1 = createMockFile('photo1.jpg', 1024, 'image/jpeg');
    const file2 = createMockFile('photo2.png', 2048, 'image/png');

    act(() => {
      result.current.addToQueue([file1, file2], ['Alt 1', 'Alt 2']);
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.queue[0].file).toBe(file1);
    expect(result.current.queue[0].altText).toBe('Alt 1');
    expect(result.current.queue[0].status).toBe('pending');
    expect(result.current.queue[1].file).toBe(file2);
    expect(result.current.queue[1].altText).toBe('Alt 2');
    expect(result.current.totalCount).toBe(2);
  });

  it('filters out invalid image types when adding to queue', () => {
    mockedIsValidImageType.mockImplementation((file) => file.type !== 'image/svg+xml');

    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const validFile = createMockFile('photo.jpg', 1024, 'image/jpeg');
    const svgFile = createMockFile('icon.svg', 512, 'image/svg+xml');

    act(() => {
      result.current.addToQueue([validFile, svgFile], ['Alt 1', 'Alt 2']);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].file.name).toBe('photo.jpg');
  });

  it('processes queue sequentially', async () => {
    const onComplete = vi.fn();
    const compressedFile = createMockFile('compressed.jpg', 512, 'image/jpeg');
    mockedCompressImage.mockResolvedValue(compressedFile);

    const mockResponse = new Response(
      JSON.stringify({ success: true, url: 'https://cdn.example.com/img1.jpg' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    mockedUploadWithTimeout.mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl, onComplete)
    );

    const file = createMockFile('photo.jpg', 2048, 'image/jpeg');

    act(() => {
      result.current.addToQueue([file], ['Test alt text']);
    });

    await act(async () => {
      await result.current.processQueue();
    });

    // Verify compression was called
    expect(mockedCompressImage).toHaveBeenCalledWith(file);

    // Verify upload was called with correct URL
    expect(mockedUploadWithTimeout).toHaveBeenCalledWith(
      `${oracleBridgeUrl}/api/blog/upload-image`,
      expect.any(FormData),
      30_000,
      expect.any(Function)
    );

    // Verify callback was called with URL and alt text
    expect(onComplete).toHaveBeenCalledWith('https://cdn.example.com/img1.jpg', 'Test alt text');
  });

  it('handles upload failure and sets error state', async () => {
    const compressedFile = createMockFile('compressed.jpg', 512, 'image/jpeg');
    mockedCompressImage.mockResolvedValue(compressedFile);

    mockedUploadWithTimeout.mockRejectedValue(new Error('Network error during upload'));

    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const file = createMockFile('photo.jpg', 2048, 'image/jpeg');

    act(() => {
      result.current.addToQueue([file], ['Alt text']);
    });

    await act(async () => {
      await result.current.processQueue();
    });

    expect(result.current.queue[0].status).toBe('failed');
    expect(result.current.queue[0].error).toBe('Network error during upload');
  });

  it('handles compression failure', async () => {
    mockedCompressImage.mockRejectedValue(new Error('Compression failed'));

    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const file = createMockFile('corrupt.jpg', 2048, 'image/jpeg');

    act(() => {
      result.current.addToQueue([file], ['Alt text']);
    });

    await act(async () => {
      await result.current.processQueue();
    });

    expect(result.current.queue[0].status).toBe('failed');
    expect(result.current.queue[0].error).toBe('Compression failed: Compression failed');
  });

  it('removes tasks from queue', () => {
    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

    act(() => {
      result.current.addToQueue([file], ['Alt text']);
    });

    const taskId = result.current.queue[0].id;

    act(() => {
      result.current.removeFromQueue(taskId);
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it('clears completed tasks', async () => {
    const compressedFile = createMockFile('compressed.jpg', 512, 'image/jpeg');
    mockedCompressImage.mockResolvedValue(compressedFile);

    const mockResponse = new Response(
      JSON.stringify({ success: true, url: 'https://cdn.example.com/img.jpg' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    mockedUploadWithTimeout.mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

    act(() => {
      result.current.addToQueue([file], ['Alt text']);
    });

    await act(async () => {
      await result.current.processQueue();
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].status).toBe('success');

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it('handles HTTP error responses', async () => {
    const compressedFile = createMockFile('compressed.jpg', 512, 'image/jpeg');
    mockedCompressImage.mockResolvedValue(compressedFile);

    const errorResponse = new Response(
      JSON.stringify({ message: 'File too large' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
    mockedUploadWithTimeout.mockResolvedValue(errorResponse);

    const { result } = renderHook(() =>
      useImageUpload(oracleBridgeUrl)
    );

    const file = createMockFile('huge.jpg', 20 * 1024 * 1024, 'image/jpeg');

    act(() => {
      result.current.addToQueue([file], ['Alt text']);
    });

    await act(async () => {
      await result.current.processQueue();
    });

    expect(result.current.queue[0].status).toBe('failed');
    expect(result.current.queue[0].error).toBe('File too large');
  });
});

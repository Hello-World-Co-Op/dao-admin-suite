/**
 * Image Processing Utilities
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 *
 * Provides:
 * - Client-side image compression using browser-image-compression
 * - Max width 1200px, max size 2MB
 * - Preserves original MIME type
 * - Uses Web Worker for non-blocking compression
 *
 * @see AC1 - Image resized client-side to max 1200px width
 * @see NFR6 - Resize + upload within 10 seconds for images up to 10MB
 */

import imageCompression from 'browser-image-compression';

/** Supported image MIME types for upload */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/** Maximum width for compressed images (pixels) */
export const MAX_IMAGE_WIDTH = 1200;

/** Maximum file size after compression (MB) */
export const MAX_IMAGE_SIZE_MB = 2;

/** Upload timeout in milliseconds (30 seconds) */
export const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Validate that a file is a supported image type.
 * Rejects SVG files to prevent XSS via embedded scripts.
 */
export function isValidImageType(file: File): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

/**
 * Compress an image file to fit within maximum dimensions and file size.
 *
 * Uses browser-image-compression with Web Worker for non-blocking processing.
 * Preserves the original MIME type during compression.
 *
 * @param file - The image file to compress
 * @param maxWidth - Maximum width/height in pixels (default: 1200)
 * @returns Compressed image as a File object
 */
export async function compressImage(
  file: File,
  maxWidth: number = MAX_IMAGE_WIDTH
): Promise<File> {
  // Skip compression if file is already small enough and within dimensions
  // browser-image-compression handles this internally, but we add a fast-path
  if (file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    // Still need to check dimensions, so let browser-image-compression handle it
  }

  const options = {
    maxWidthOrHeight: maxWidth,
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    useWebWorker: true,
    fileType: file.type as string,
  };

  const compressed = await imageCompression(file, options);

  // browser-image-compression returns a File object
  return compressed;
}

/**
 * Upload a file with a timeout using AbortController.
 *
 * @param url - The upload endpoint URL
 * @param formData - The FormData to upload
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @param onProgress - Optional progress callback (0-100)
 * @returns The fetch Response
 * @throws Error if timeout or network failure
 */
export async function uploadWithTimeout(
  url: string,
  formData: FormData,
  timeoutMs: number = UPLOAD_TIMEOUT_MS,
  onProgress?: (percent: number) => void
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use XMLHttpRequest for progress tracking if callback provided
    if (onProgress) {
      return new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          clearTimeout(timeoutId);
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers({
              'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json',
            }),
          });
          resolve(response);
        });

        xhr.addEventListener('error', () => {
          clearTimeout(timeoutId);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Upload timed out after 30 seconds'));
        });

        // Listen for abort from our controller
        controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        xhr.open('POST', url);
        xhr.withCredentials = true; // Include SSO cookies
        xhr.send(formData);
      });
    }

    // Simple fetch without progress tracking
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload timed out after 30 seconds');
    }
    throw error;
  }
}

/**
 * Image Upload Hook
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 *
 * Provides:
 * - Sequential upload queue with progress tracking
 * - Image compression before upload
 * - 30-second timeout per upload with retry
 * - ARIA live region announcements
 *
 * @see AC1 - Image resized client-side before upload
 * @see AC2 - Sequential upload queue with aggregate progress
 * @see AC5 - Retry on timeout/network error
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { compressImage, uploadWithTimeout, isValidImageType } from '@/utils/imageUtils';

/** Status of an individual upload task */
export type UploadTaskStatus = 'pending' | 'compressing' | 'uploading' | 'success' | 'failed';

/** Represents a single image upload in the queue */
export interface UploadTask {
  /** Unique identifier for this upload task */
  id: string;
  /** The original file to upload */
  file: File;
  /** Alt text for the image (WCAG requirement) */
  altText: string;
  /** Current status */
  status: UploadTaskStatus;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** URL of the uploaded image (set on success) */
  url?: string;
  /** Error message (set on failure) */
  error?: string;
}

/** Return type of the useImageUpload hook */
export interface UseImageUploadReturn {
  /** Current upload queue */
  queue: UploadTask[];
  /** Whether any upload is currently in progress */
  isUploading: boolean;
  /** Add files to the upload queue */
  addToQueue: (files: File[], altTexts: string[]) => void;
  /** Process the upload queue sequentially */
  processQueue: () => Promise<void>;
  /** Retry a failed upload by task ID */
  retryUpload: (taskId: string) => Promise<void>;
  /** Remove a task from the queue */
  removeFromQueue: (taskId: string) => void;
  /** Clear all completed/failed tasks from the queue */
  clearCompleted: () => void;
  /** Number of completed uploads */
  completedCount: number;
  /** Total number of uploads in the queue */
  totalCount: number;
  /** Status message for ARIA live region */
  statusMessage: string;
}

let taskIdCounter = 0;

function generateTaskId(): string {
  taskIdCounter += 1;
  return `upload-${Date.now()}-${taskIdCounter}`;
}

/**
 * Custom hook for managing image uploads with sequential processing.
 *
 * @param oracleBridgeUrl - Base URL for the oracle-bridge API
 * @param onUploadComplete - Callback when an image upload completes successfully
 */
export function useImageUpload(
  oracleBridgeUrl: string,
  onUploadComplete?: (url: string, altText: string) => void
): UseImageUploadReturn {
  const [queue, setQueue] = useState<UploadTask[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const processingRef = useRef(false);
  // Keep a ref in sync with queue state for use in async operations
  const queueRef = useRef<UploadTask[]>([]);

  // Sync ref with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const isUploading = queue.some(
    (task) => task.status === 'compressing' || task.status === 'uploading'
  );

  const completedCount = queue.filter((task) => task.status === 'success').length;
  const totalCount = queue.length;

  const updateTask = useCallback((taskId: string, updates: Partial<UploadTask>) => {
    setQueue((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  }, []);

  const uploadSingleImage = useCallback(
    async (task: UploadTask): Promise<{ url: string } | null> => {
      // Step 1: Compress
      updateTask(task.id, { status: 'compressing', progress: 0 });
      setStatusMessage(`Compressing ${task.file.name}...`);

      let compressedFile: File;
      try {
        compressedFile = await compressImage(task.file);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Compression failed';
        updateTask(task.id, { status: 'failed', error: message });
        setStatusMessage(`Failed to compress ${task.file.name}`);
        return null;
      }

      // Step 2: Upload
      updateTask(task.id, { status: 'uploading', progress: 0 });
      setStatusMessage(`Uploading ${task.file.name}...`);

      const formData = new FormData();
      formData.append('image', compressedFile);

      try {
        const response = await uploadWithTimeout(
          `${oracleBridgeUrl}/api/blog/upload-image`,
          formData,
          30_000,
          (percent) => {
            updateTask(task.id, { progress: percent });
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Upload failed: ${response.status}`);
        }

        const result = await response.json();
        updateTask(task.id, { status: 'success', progress: 100, url: result.url });
        setStatusMessage(`Uploaded ${task.file.name} successfully`);
        return { url: result.url };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        updateTask(task.id, { status: 'failed', error: message, progress: 0 });
        setStatusMessage(`Upload failed: ${task.file.name}. Please retry.`);
        return null;
      }
    },
    [oracleBridgeUrl, updateTask]
  );

  const addToQueue = useCallback((files: File[], altTexts: string[]) => {
    const newTasks: UploadTask[] = files
      .filter((file) => isValidImageType(file))
      .map((file, index) => ({
        id: generateTaskId(),
        file,
        altText: altTexts[index] || '',
        status: 'pending' as UploadTaskStatus,
        progress: 0,
      }));

    // Update both state and ref immediately
    setQueue((prev) => {
      const updated = [...prev, ...newTasks];
      queueRef.current = updated;
      return updated;
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const pendingTasks = queueRef.current.filter((task) => task.status === 'pending');

      for (let i = 0; i < pendingTasks.length; i++) {
        const task = pendingTasks[i];
        const currentIndex = i + 1;
        const totalPending = pendingTasks.length;

        setStatusMessage(`Uploading ${currentIndex} of ${totalPending} images...`);

        const result = await uploadSingleImage(task);

        if (result && onUploadComplete) {
          onUploadComplete(result.url, task.altText);
        }
      }

      setStatusMessage(
        pendingTasks.length > 0
          ? `All ${pendingTasks.length} images processed`
          : ''
      );
    } finally {
      processingRef.current = false;
    }
  }, [uploadSingleImage, onUploadComplete]);

  const retryUpload = useCallback(
    async (taskId: string) => {
      const taskToRetry = queueRef.current.find((t) => t.id === taskId);

      if (!taskToRetry || taskToRetry.status !== 'failed') return;

      updateTask(taskId, { status: 'pending', progress: 0, error: undefined });

      const result = await uploadSingleImage(taskToRetry);
      if (result && onUploadComplete) {
        onUploadComplete(result.url, taskToRetry.altText);
      }
    },
    [uploadSingleImage, onUploadComplete, updateTask]
  );

  const removeFromQueue = useCallback((taskId: string) => {
    setQueue((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((task) => task.status !== 'success'));
  }, []);

  return {
    queue,
    isUploading,
    addToQueue,
    processQueue,
    retryUpload,
    removeFromQueue,
    clearCompleted,
    completedCount,
    totalCount,
    statusMessage,
  };
}

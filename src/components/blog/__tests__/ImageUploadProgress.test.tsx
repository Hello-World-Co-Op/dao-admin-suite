/**
 * Tests for ImageUploadProgress Component
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 *
 * @see AC2 - Sequential upload queue with aggregate progress
 * @see AC5 - Retry button on failed uploads
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadProgress } from '../ImageUploadProgress';
import type { UploadTask } from '@/hooks/useImageUpload';

/** Create a mock File */
function createMockFile(name: string): File {
  return new File(['content'], name, { type: 'image/jpeg' });
}

/** Create a mock UploadTask */
function createTask(overrides: Partial<UploadTask> = {}): UploadTask {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    file: createMockFile('photo.jpg'),
    altText: 'Test image',
    status: 'pending',
    progress: 0,
    ...overrides,
  };
}

describe('ImageUploadProgress', () => {
  const defaultProps = {
    queue: [] as UploadTask[],
    statusMessage: '',
    onRetry: vi.fn(),
    onRemove: vi.fn(),
    onClearCompleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when queue is empty', () => {
    render(<ImageUploadProgress {...defaultProps} />);
    expect(screen.queryByTestId('image-upload-progress')).not.toBeInTheDocument();
  });

  it('renders when queue has tasks', () => {
    const queue = [createTask({ status: 'uploading', progress: 50 })];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);
    expect(screen.getByTestId('image-upload-progress')).toBeInTheDocument();
  });

  it('shows aggregate progress header', () => {
    const queue = [
      createTask({ id: 'task-1', status: 'success' }),
      createTask({ id: 'task-2', status: 'uploading', progress: 50 }),
      createTask({ id: 'task-3', status: 'pending' }),
    ];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);

    expect(screen.getByTestId('upload-progress-header')).toHaveTextContent(
      'Uploading images (1/3)'
    );
  });

  it('shows "all uploaded" when all tasks complete', () => {
    const queue = [
      createTask({ id: 'task-1', status: 'success' }),
      createTask({ id: 'task-2', status: 'success' }),
    ];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);

    expect(screen.getByTestId('upload-progress-header')).toHaveTextContent(
      'All 2 images uploaded'
    );
  });

  it('shows retry button for failed uploads', () => {
    const failedTask = createTask({
      id: 'task-fail',
      status: 'failed',
      error: 'Upload timed out after 30 seconds',
    });
    render(<ImageUploadProgress {...defaultProps} queue={[failedTask]} />);

    expect(screen.getByTestId('retry-button-task-fail')).toBeInTheDocument();
    expect(screen.getByTestId('error-message-task-fail')).toHaveTextContent(
      'Upload timed out after 30 seconds'
    );
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const failedTask = createTask({
      id: 'task-fail',
      status: 'failed',
      error: 'Network error',
    });
    render(<ImageUploadProgress {...defaultProps} queue={[failedTask]} />);

    await user.click(screen.getByTestId('retry-button-task-fail'));
    expect(defaultProps.onRetry).toHaveBeenCalledWith('task-fail');
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const failedTask = createTask({
      id: 'task-fail',
      status: 'failed',
      error: 'Error',
    });
    render(<ImageUploadProgress {...defaultProps} queue={[failedTask]} />);

    await user.click(screen.getByTestId('remove-button-task-fail'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('task-fail');
  });

  it('shows clear completed button when uploads are done', () => {
    const queue = [createTask({ status: 'success' })];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);

    expect(screen.getByTestId('clear-completed-button')).toBeInTheDocument();
  });

  it('calls onClearCompleted when clear button is clicked', async () => {
    const user = userEvent.setup();
    const queue = [createTask({ status: 'success' })];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);

    await user.click(screen.getByTestId('clear-completed-button'));
    expect(defaultProps.onClearCompleted).toHaveBeenCalled();
  });

  it('has ARIA live region for status announcements', () => {
    const queue = [createTask({ status: 'uploading' })];
    render(
      <ImageUploadProgress
        {...defaultProps}
        queue={queue}
        statusMessage="Uploading 1 of 3 images..."
      />
    );

    const liveRegion = screen.getByTestId('upload-status-live');
    expect(liveRegion).toHaveAttribute('role', 'status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveTextContent('Uploading 1 of 3 images...');
  });

  it('shows progress bar for uploading tasks', () => {
    const task = createTask({ id: 'task-1', status: 'uploading', progress: 75 });
    render(<ImageUploadProgress {...defaultProps} queue={[task]} />);

    const progressBar = screen.getByTestId('progress-bar-task-1');
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });

  it('shows failed count footer when uploads fail', () => {
    const queue = [
      createTask({ id: 'task-1', status: 'failed', error: 'Error 1' }),
      createTask({ id: 'task-2', status: 'failed', error: 'Error 2' }),
    ];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);

    expect(screen.getByTestId('failed-count')).toHaveTextContent(
      '2 uploads failed'
    );
  });

  it('shows correct status icons for each state', () => {
    const queue = [
      createTask({ id: 'pending', status: 'pending' }),
      createTask({ id: 'uploading', status: 'uploading', progress: 50 }),
      createTask({ id: 'success', status: 'success' }),
      createTask({ id: 'failed', status: 'failed', error: 'Error' }),
    ];
    render(<ImageUploadProgress {...defaultProps} queue={queue} />);

    expect(screen.getByTestId('status-pending')).toBeInTheDocument();
    expect(screen.getByTestId('status-uploading')).toBeInTheDocument();
    expect(screen.getByTestId('status-success')).toBeInTheDocument();
    expect(screen.getByTestId('status-failed')).toBeInTheDocument();
  });
});

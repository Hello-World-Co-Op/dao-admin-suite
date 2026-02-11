import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import KYCReviewDetail from './KYCReviewDetail';
import type { KYCRecord } from '@/types/user-service';
import { Principal } from '@dfinity/principal';

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

// Helper to create mock KYC record
const createMockRecord = (): KYCRecord => {
  const now = Date.now();
  const flaggedAt = BigInt((now - 40 * 3600 * 1000) * 1_000_000);

  return {
    user_id: Principal.fromText('aaaaa-aa'),
    inquiry_id: 'inq_test_001',
    status: { UnderReview: null },
    created_at: BigInt(now * 1_000_000),
    updated_at: BigInt(now * 1_000_000),
    verified_at: [],
    expiry_date: [],
    flagged_at: [flaggedAt],
    reviewer: [],
    review_notes: [],
    appeal_reason: ['Document quality issue - image was blurry but I have a clearer version'],
    appeal_submitted_at: [flaggedAt],
  };
};

describe('KYCReviewDetail', () => {
  let mockRecord: KYCRecord;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecord = createMockRecord();
  });

  describe('Loading State', () => {
    it('should eventually load and display case details', async () => {
      render(<KYCReviewDetail record={mockRecord} />);
      await waitFor(() => {
        expect(screen.getByText('KYC Review')).toBeInTheDocument();
      });
    });
  });

  describe('Header', () => {
    it('should display title and inquiry ID', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('KYC Review')).toBeInTheDocument();
      });

      expect(screen.getByText('inq_test_001')).toBeInTheDocument();
    });

    it('should show close button when onClose is provided', async () => {
      const onClose = vi.fn();
      render(<KYCReviewDetail record={mockRecord} onClose={onClose} />);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close detail panel');
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn();
      render(<KYCReviewDetail record={mockRecord} onClose={onClose} />);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close detail panel');
        fireEvent.click(closeButton);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not show close button when onClose is not provided', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Close detail panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Case Summary', () => {
    it('should display case summary section', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Case Summary')).toBeInTheDocument();
      });
    });

    it('should display user ID label', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('User ID')).toBeInTheDocument();
      });
    });

    it('should display status badge', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Under Review')).toBeInTheDocument();
      });
    });

    it('should display timestamps', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Created At')).toBeInTheDocument();
        expect(screen.getByText('Flagged At')).toBeInTheDocument();
      });
    });
  });

  describe('Appeal Reason', () => {
    it('should display appeal reason section when appeal exists', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Appeal Reason')).toBeInTheDocument();
      });

      const appealTexts = screen.getAllByText(
        'Document quality issue - image was blurry but I have a clearer version'
      );
      expect(appealTexts.length).toBeGreaterThan(0);
    });

    it('should not display appeal section when no appeal', async () => {
      const recordWithoutAppeal: KYCRecord = {
        ...mockRecord,
        appeal_reason: [] as [] | [string],
        appeal_submitted_at: [] as [] | [bigint],
      };
      render(<KYCReviewDetail record={recordWithoutAppeal} />);

      await waitFor(() => {
        expect(screen.queryByText('Appeal Reason')).not.toBeInTheDocument();
      });
    });
  });

  describe('Verification Details', () => {
    it('should display Persona inquiry data section', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Verification Details')).toBeInTheDocument();
      });
    });

    it('should display submitted user information', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Submitted Information')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display verification checks', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Verification Checks')).toBeInTheDocument();
      });
    });

    it('should display document information', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Submitted Documents')).toBeInTheDocument();
      });
    });
  });

  describe('Audit Trail', () => {
    it('should display audit trail section', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('Audit Trail')).toBeInTheDocument();
      });
    });

    it('should display audit entries', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText('KYC verification initiated')).toBeInTheDocument();
        expect(screen.getByText('Verification failed by Persona')).toBeInTheDocument();
        expect(screen.getByText('Appeal submitted')).toBeInTheDocument();
      });
    });
  });

  describe('Review Decision Form', () => {
    it('should display review notes textarea', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/);
        expect(textarea).toBeInTheDocument();
      });
    });

    it('should display Approve and Reject buttons', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
      });
    });

    it('should disable buttons when notes are empty', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        const approveButton = screen.getByRole('button', { name: 'Approve' });
        const rejectButton = screen.getByRole('button', { name: 'Reject' });
        expect(approveButton).toBeDisabled();
        expect(rejectButton).toBeDisabled();
      });
    });

    it('should enable buttons when notes are entered', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Review notes here' } });
      });

      const approveButton = screen.getByRole('button', { name: 'Approve' });
      const rejectButton = screen.getByRole('button', { name: 'Reject' });
      expect(approveButton).not.toBeDisabled();
      expect(rejectButton).not.toBeDisabled();
    });
  });

  describe('Review Actions', () => {
    it('should call onAction when Approve is clicked', async () => {
      const onAction = vi.fn().mockResolvedValue(undefined);
      render(<KYCReviewDetail record={mockRecord} onAction={onAction} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Approved - all checks passed' } });
      });

      const approveButton = screen.getByRole('button', { name: 'Approve' });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith(
          'inq_test_001',
          'Approved',
          'Approved - all checks passed'
        );
      });
    });

    it('should call onAction when Reject is clicked', async () => {
      const onAction = vi.fn().mockResolvedValue(undefined);
      render(<KYCReviewDetail record={mockRecord} onAction={onAction} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Rejected - insufficient documentation' } });
      });

      const rejectButton = screen.getByRole('button', { name: 'Reject' });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith(
          'inq_test_001',
          'Rejected',
          'Rejected - insufficient documentation'
        );
      });
    });

    it('should call onClose after successful submission', async () => {
      const onAction = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();
      render(<KYCReviewDetail record={mockRecord} onAction={onAction} onClose={onClose} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Review complete' } });
      });

      const approveButton = screen.getByRole('button', { name: 'Approve' });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should display error message on submission failure', async () => {
      const onAction = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<KYCReviewDetail record={mockRecord} onAction={onAction} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Review notes' } });
      });

      const approveButton = screen.getByRole('button', { name: 'Approve' });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track detail load event', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('admin_kyc_detail_loaded', {
          inquiry_id: 'inq_test_001',
        });
      });
    });

    it('should track review submission event', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      const onAction = vi.fn().mockResolvedValue(undefined);
      render(<KYCReviewDetail record={mockRecord} onAction={onAction} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Approved' } });
      });

      const approveButton = screen.getByRole('button', { name: 'Approve' });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('admin_kyc_review_submitted', {
          inquiry_id: 'inq_test_001',
          decision: 'Approved',
          notes_length: 8,
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have required field indicator', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        expect(screen.getByText(/Review Notes/)).toBeInTheDocument();
        expect(screen.getByText('*')).toBeInTheDocument();
      });
    });

    it('should have proper labels for form elements', async () => {
      render(<KYCReviewDetail record={mockRecord} />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Review Notes/);
        expect(textarea).toHaveAttribute('id', 'action-notes');
      });
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import KYCReviewPage from './KYCReviewPage';
import type { KYCRecord } from '@/types/user-service';

// Mock prop types for type safety
interface MockDashboardProps {
  onSelectCase?: (record: { inquiry_id: string; user_id: string }) => void;
}

interface MockDetailProps {
  record: KYCRecord;
  onClose?: () => void;
  onAction?: (inquiryId: string, decision: 'Approved' | 'Rejected', notes: string) => Promise<void>;
}

// Mock child components
vi.mock('@/components/admin/KYCReviewDashboard', () => ({
  default: function MockDashboard({ onSelectCase }: MockDashboardProps) {
    return (
      <div data-testid="mock-dashboard">
        <h2>Mock Dashboard</h2>
        <button onClick={() => onSelectCase?.({ inquiry_id: 'test_001', user_id: 'user_001' })}>
          Select Case
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/admin/KYCReviewDetail', () => ({
  default: function MockDetail({ record, onClose, onAction }: MockDetailProps) {
    return (
      <div data-testid="mock-detail">
        <h2>Mock Detail</h2>
        <p>Case: {record.inquiry_id}</p>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onAction?.('test_001', 'Approved', 'Test notes')}>
          Submit Approve
        </button>
        <button onClick={() => onAction?.('test_001', 'Rejected', 'Test notes')}>
          Submit Reject
        </button>
      </div>
    );
  },
}));

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('KYCReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout', () => {
    it('should render page header', () => {
      render(<KYCReviewPage />);
      expect(screen.getByText('KYC Review Administration')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Review and approve identity verification cases requiring manual attention'
        )
      ).toBeInTheDocument();
    });

    it('should render dashboard initially', () => {
      render(<KYCReviewPage />);
      expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    });

    it('should not render detail panel initially', () => {
      render(<KYCReviewPage />);
      expect(screen.queryByTestId('mock-detail')).not.toBeInTheDocument();
    });

    it('should show empty state in right panel when no case selected', () => {
      render(<KYCReviewPage />);
      expect(screen.getByText('No case selected')).toBeInTheDocument();
      expect(
        screen.getByText('Select a case from the dashboard to view details and take action.')
      ).toBeInTheDocument();
    });
  });

  describe('Case Selection', () => {
    it('should show detail panel when case is selected', async () => {
      render(<KYCReviewPage />);

      const selectButton = screen.getByText('Select Case');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('mock-detail')).toBeInTheDocument();
      });
    });

    it('should display selected case inquiry ID in detail', async () => {
      render(<KYCReviewPage />);

      const selectButton = screen.getByText('Select Case');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Case: test_001')).toBeInTheDocument();
      });
    });

    it('should track case selection event', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      render(<KYCReviewPage />);

      const selectButton = screen.getByText('Select Case');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('admin_kyc_case_opened', {
          inquiry_id: 'test_001',
        });
      });
    });

    it('should hide empty state when case is selected', async () => {
      render(<KYCReviewPage />);

      const selectButton = screen.getByText('Select Case');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.queryByText('No case selected')).not.toBeInTheDocument();
      });
    });
  });

  describe('Close Detail Panel', () => {
    it('should close detail panel when close button clicked', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => expect(screen.getByTestId('mock-detail')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Close'));
      await waitFor(() => expect(screen.queryByTestId('mock-detail')).not.toBeInTheDocument());
    });

    it('should show empty state again after closing detail', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByText('No case selected')).toBeInTheDocument();
      });
    });
  });

  describe('Review Actions', () => {
    it('should handle approve action', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Approve'));

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('admin_kyc_review_action_started', {
          inquiry_id: 'test_001',
          decision: 'Approved',
        });
      });
    });

    it('should handle reject action', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Reject'));

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('admin_kyc_review_action_started', {
          inquiry_id: 'test_001',
          decision: 'Rejected',
        });
      });
    });

    it('should show success notification on successful approval', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Approve'));

      await waitFor(
        () => {
          expect(
            screen.getByText(/Case approved successfully. The user has been notified./)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should close detail panel after successful review', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Approve'));

      await waitFor(
        () => {
          expect(screen.queryByTestId('mock-detail')).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Notifications', () => {
    it('should display success notification with green styling', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Approve'));

      await waitFor(
        () => {
          const notification = screen.getByRole('alert');
          expect(notification).toHaveClass('bg-green-50');
        },
        { timeout: 3000 }
      );
    });

    it('should allow dismissing notification', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Approve'));

      await waitFor(() => screen.getByRole('alert'), { timeout: 3000 });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render with responsive grid classes', () => {
      const { container } = render(<KYCReviewPage />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('lg:grid-cols-2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<KYCReviewPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('KYC Review Administration');
    });

    it('should have accessible notification', async () => {
      render(<KYCReviewPage />);

      fireEvent.click(screen.getByText('Select Case'));
      await waitFor(() => screen.getByTestId('mock-detail'));

      fireEvent.click(screen.getByText('Submit Approve'));

      await waitFor(() => screen.getByRole('alert'), { timeout: 3000 });

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });
});

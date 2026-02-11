import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import KYCReviewDashboard from './KYCReviewDashboard';

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

describe('KYCReviewDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should eventually load and display data', async () => {
      render(<KYCReviewDashboard />);
      await waitFor(() => {
        expect(screen.getByText('KYC Review Queue')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Display', () => {
    it('should display header with case count', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('KYC Review Queue')).toBeInTheDocument();
      });

      expect(screen.getByText(/3 cases pending review/i)).toBeInTheDocument();
    });

    it('should display table headers', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('SLA Status')).toBeInTheDocument();
      });

      expect(screen.getByText('Inquiry ID')).toBeInTheDocument();
      expect(screen.getByText('User ID')).toBeInTheDocument();
      expect(screen.getByText('Appeal Reason')).toBeInTheDocument();
      expect(screen.getByText('Hours Pending')).toBeInTheDocument();
    });

    it('should display mock case data', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('inq_appeal_001')).toBeInTheDocument();
      });

      expect(screen.getByText('inq_appeal_002')).toBeInTheDocument();
      expect(screen.getByText('inq_appeal_003')).toBeInTheDocument();
    });
  });

  describe('SLA Status Indicators', () => {
    it('should show red status for breached SLA (>48 hours)', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Breached')).toBeInTheDocument();
      });
    });

    it('should show yellow status for approaching SLA (36-48 hours)', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Warning')).toBeInTheDocument();
      });
    });

    it('should show green status for good SLA (<36 hours)', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Good')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('should default to SLA urgency sorting', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        const select = screen.getByLabelText('Sort by:') as HTMLSelectElement;
        expect(select.value).toBe('sla');
      });
    });

    it('should allow changing sort order', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        const select = screen.getByLabelText('Sort by:') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'date' } });
        expect(select.value).toBe('date');
      });
    });

    it('should sort by SLA urgency (oldest first)', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        const rows = screen.getAllByRole('button');
        expect(rows[0]).toHaveTextContent('inq_appeal_001');
      });
    });
  });

  describe('Pagination', () => {
    it('should not show pagination with fewer than 10 items', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });
    });
  });

  describe('Case Selection', () => {
    it('should call onSelectCase when row is clicked', async () => {
      const onSelectCase = vi.fn();
      render(<KYCReviewDashboard onSelectCase={onSelectCase} />);

      await waitFor(() => {
        const firstRow = screen.getAllByRole('button')[0];
        fireEvent.click(firstRow);
      });

      expect(onSelectCase).toHaveBeenCalledTimes(1);
      expect(onSelectCase).toHaveBeenCalledWith(
        expect.objectContaining({
          inquiry_id: 'inq_appeal_001',
        })
      );
    });

    it('should handle keyboard navigation (Enter key)', async () => {
      const onSelectCase = vi.fn();
      render(<KYCReviewDashboard onSelectCase={onSelectCase} />);

      await waitFor(() => {
        const firstRow = screen.getAllByRole('button')[0];
        fireEvent.keyDown(firstRow, { key: 'Enter' });
      });

      expect(onSelectCase).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation (Space key)', async () => {
      const onSelectCase = vi.fn();
      render(<KYCReviewDashboard onSelectCase={onSelectCase} />);

      await waitFor(() => {
        const firstRow = screen.getAllByRole('button')[0];
        fireEvent.keyDown(firstRow, { key: ' ' });
      });

      expect(onSelectCase).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for rows', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        const firstRow = screen.getAllByRole('button')[0];
        expect(firstRow).toHaveAttribute('aria-label', 'Review case inq_appeal_001');
      });
    });

    it('should be keyboard navigable with tabIndex', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        const rows = screen.getAllByRole('button');
        rows.forEach((row) => {
          expect(row).toHaveAttribute('tabIndex', '0');
        });
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track dashboard load event', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('admin_kyc_dashboard_loaded', {
          case_count: 3,
        });
      });
    });

    it('should track case selection event', async () => {
      const { trackEvent } = await import('@/utils/analytics');
      const onSelectCase = vi.fn();
      render(<KYCReviewDashboard onSelectCase={onSelectCase} />);

      await waitFor(() => {
        const firstRow = screen.getAllByRole('button')[0];
        fireEvent.click(firstRow);
      });

      expect(trackEvent).toHaveBeenCalledWith('admin_kyc_case_selected', {
        inquiry_id: 'inq_appeal_001',
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render with dashboard container', async () => {
      render(<KYCReviewDashboard />);

      await waitFor(() => {
        const container = screen.getByText('KYC Review Queue').closest('.kyc-review-dashboard');
        expect(container).toBeInTheDocument();
      });
    });
  });
});

/**
 * AuthorManagement Tests
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 7.2: 8 tests covering list, add, revoke, validation, and error states
 *
 * @see AC2 - Author role management - search by principal, assign/revoke roles
 * @see FR33 - Admin UI for author management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock blogApi
const mockListAuthorRoles = vi.fn();
const mockSetAuthorRole = vi.fn();
const mockRemoveAuthorRole = vi.fn();

vi.mock('@/utils/blogApi', () => ({
  listAuthorRoles: () => mockListAuthorRoles(),
  setAuthorRole: (...args: unknown[]) => mockSetAuthorRole(...args),
  removeAuthorRole: (...args: unknown[]) => mockRemoveAuthorRole(...args),
}));

import AuthorManagement from './AuthorManagement';

const mockAuthors = [
  {
    principal: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    role: 'Admin' as const,
    display_name: 'Alice Admin',
    display_role: 'Co-op Founder',
  },
  {
    principal: 'aaaaa-aa',
    role: 'Author' as const,
    display_name: 'Bob Writer',
    display_role: 'Technical Writer',
  },
];

describe('AuthorManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListAuthorRoles.mockResolvedValue(mockAuthors);
    mockSetAuthorRole.mockResolvedValue(undefined);
    mockRemoveAuthorRole.mockResolvedValue(undefined);
  });

  it('renders author table with existing authors (Task 2.1, 2.7)', async () => {
    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('author-table')).toBeInTheDocument();
    });

    // Both authors visible
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('Bob Writer')).toBeInTheDocument();

    // Role badges
    expect(screen.getByTestId('role-badge-rrkah-fqaaa-aaaaa-aaaaq-cai')).toHaveTextContent('Admin');
    expect(screen.getByTestId('role-badge-aaaaa-aa')).toHaveTextContent('Author');
  });

  it('shows empty state when no authors exist', async () => {
    mockListAuthorRoles.mockResolvedValue([]);

    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('no-authors')).toBeInTheDocument();
    });

    expect(screen.getByTestId('no-authors')).toHaveTextContent('No authors configured yet');
  });

  it('shows error state when fetch fails', async () => {
    mockListAuthorRoles.mockRejectedValue(new Error('Network error'));

    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('author-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('author-error')).toHaveTextContent('Failed to load author roles');
  });

  it('opens AddAuthorModal when Add Author button is clicked (Task 2.3)', async () => {
    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('add-author-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-author-button'));

    await waitFor(() => {
      expect(screen.getByTestId('add-author-modal')).toBeInTheDocument();
    });
  });

  it('adds new author and refreshes list (Task 2.4)', async () => {
    const updatedAuthors = [
      ...mockAuthors,
      {
        principal: 'bbbbb-bb',
        role: 'Author' as const,
        display_name: 'Charlie New',
        display_role: 'Editor',
      },
    ];

    // After add, return updated list
    mockListAuthorRoles
      .mockResolvedValueOnce(mockAuthors)
      .mockResolvedValueOnce(updatedAuthors);

    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('add-author-button')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByTestId('add-author-button'));

    await waitFor(() => {
      expect(screen.getByTestId('add-author-form')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('principal-input'), { target: { value: 'bbbbb-bb' } });
    fireEvent.change(screen.getByTestId('display-name-input'), { target: { value: 'Charlie New' } });
    fireEvent.change(screen.getByTestId('display-role-input'), { target: { value: 'Editor' } });

    // Submit
    fireEvent.click(screen.getByTestId('add-author-submit'));

    await waitFor(() => {
      expect(mockSetAuthorRole).toHaveBeenCalledWith('bbbbb-bb', 'Author', 'Charlie New', 'Editor');
    });

    // Toast confirmation
    await waitFor(() => {
      expect(screen.getByTestId('author-toast')).toHaveTextContent('Charlie New added as Author');
    });
  });

  it('shows validation errors for empty principal in AddAuthorModal (Task 2.2)', async () => {
    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('add-author-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-author-button'));

    await waitFor(() => {
      expect(screen.getByTestId('add-author-form')).toBeInTheDocument();
    });

    // Submit without filling fields
    fireEvent.click(screen.getByTestId('add-author-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('principal-error')).toHaveTextContent('Principal is required');
      expect(screen.getByTestId('display-name-error')).toHaveTextContent('Display name is required');
      expect(screen.getByTestId('display-role-error')).toHaveTextContent('Display role is required');
    });

    // setAuthorRole should NOT have been called
    expect(mockSetAuthorRole).not.toHaveBeenCalled();
  });

  it('shows revoke confirmation dialog and revokes author (Task 2.5, 2.6, 2.8)', async () => {
    const afterRevoke = [mockAuthors[0]]; // Only Alice remains
    mockListAuthorRoles
      .mockResolvedValueOnce(mockAuthors)
      .mockResolvedValueOnce(afterRevoke);

    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('revoke-button-aaaaa-aa')).toBeInTheDocument();
    });

    // Click revoke
    fireEvent.click(screen.getByTestId('revoke-button-aaaaa-aa'));

    // Confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('revoke-confirm-dialog')).toBeInTheDocument();
    });
    // Bob Writer appears in both the table and dialog - use getAllByText
    expect(screen.getAllByText(/Bob Writer/).length).toBeGreaterThanOrEqual(2);

    // Confirm revoke
    fireEvent.click(screen.getByTestId('revoke-confirm'));

    await waitFor(() => {
      expect(mockRemoveAuthorRole).toHaveBeenCalledWith('aaaaa-aa');
    });

    // Toast confirmation
    await waitFor(() => {
      expect(screen.getByTestId('author-toast')).toHaveTextContent('Revoked role from Bob Writer');
    });
  });

  it('shows error toast when add author fails', async () => {
    mockSetAuthorRole.mockRejectedValue(new Error('Canister error'));

    render(<AuthorManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('add-author-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-author-button'));

    await waitFor(() => {
      expect(screen.getByTestId('add-author-form')).toBeInTheDocument();
    });

    // Fill valid form
    fireEvent.change(screen.getByTestId('principal-input'), { target: { value: 'ccccc-cc' } });
    fireEvent.change(screen.getByTestId('display-name-input'), { target: { value: 'Dave' } });
    fireEvent.change(screen.getByTestId('display-role-input'), { target: { value: 'Writer' } });

    fireEvent.click(screen.getByTestId('add-author-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('author-toast')).toHaveTextContent('Canister error');
    });
  });
});

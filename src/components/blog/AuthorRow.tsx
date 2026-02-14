/**
 * AuthorRow Component
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 2.5: Create AuthorRow with "Revoke" action button
 *
 * Displays a single author entry in the author management table with:
 * - Display name and display role
 * - Principal (truncated with tooltip)
 * - Role badge (Admin/Author)
 * - Revoke button
 *
 * @see AC2 - Author role management, revoke roles from existing authors
 */

import { useCallback } from 'react';
import type { AuthorRoleEntry } from '@/utils/blogApi';

interface AuthorRowProps {
  author: AuthorRoleEntry;
  onRevoke: (principal: string, displayName: string) => void;
  isRevoking: boolean;
}

/**
 * Truncate a principal string for display (first 8...last 5 chars).
 */
function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-5)}`;
}

export default function AuthorRow({ author, onRevoke, isRevoking }: AuthorRowProps) {
  const handleRevoke = useCallback(() => {
    onRevoke(author.principal, author.display_name);
  }, [author.principal, author.display_name, onRevoke]);

  return (
    <tr data-testid={`author-row-${author.principal}`}>
      <td className="px-4 py-3 text-sm text-gray-900">
        <div>
          <p className="font-medium">{author.display_name}</p>
          <p className="text-gray-500 text-xs">{author.display_role}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        <span title={author.principal} className="font-mono text-xs">
          {truncatePrincipal(author.principal)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            author.role === 'Admin'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
          data-testid={`role-badge-${author.principal}`}
        >
          {author.role}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isRevoking}
          className={`text-sm font-medium ${
            isRevoking
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-800'
          }`}
          data-testid={`revoke-button-${author.principal}`}
        >
          Revoke
        </button>
      </td>
    </tr>
  );
}

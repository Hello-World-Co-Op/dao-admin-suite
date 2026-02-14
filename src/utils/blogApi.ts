/**
 * Blog API utilities for oracle-bridge communication
 *
 * Handles save_draft endpoint calls with proper error mapping
 * for auto-save functionality.
 *
 * Also provides author role management and readiness data utilities
 * for the Operations dashboard.
 *
 * @see BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 * @see BL-008.7.2 - Admin Operations Dashboard
 */

import type { SaveResult } from '@/hooks/useAutoSave';

// =============================================================================
// Types
// =============================================================================

export interface AuthorRoleEntry {
  principal: string;
  role: 'Admin' | 'Author';
  display_name: string;
  display_role: string;
}

export interface ReadinessData {
  publishedPostCount: number;
  totalPosts: number;
  categories: Array<{ name: string; slug: string; post_count: number }>;
}

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

// =============================================================================
// Author Role Management (BL-008.7.2 Task 2)
// =============================================================================

/**
 * List all author roles from the blog canister via oracle-bridge.
 *
 * @throws Error if fetch fails or returns non-200
 * @see BL-008.7.2 Task 2.7 - List existing authors
 */
export async function listAuthorRoles(): Promise<AuthorRoleEntry[]> {
  const oracleBridgeUrl = getOracleBridgeUrl();
  const response = await fetch(`${oracleBridgeUrl}/api/blog/author-roles`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch author roles: ${response.status}`);
  }

  const data = await response.json();
  return data.roles || [];
}

/**
 * Set (grant or update) an author role via oracle-bridge.
 *
 * @throws Error if fetch fails or returns non-200
 * @see BL-008.7.2 Task 2.4 - Wire set_author_role
 */
export async function setAuthorRole(
  principal: string,
  role: 'Admin' | 'Author',
  displayName: string,
  displayRole: string,
): Promise<void> {
  const oracleBridgeUrl = getOracleBridgeUrl();
  const response = await fetch(`${oracleBridgeUrl}/api/blog/set-author-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      principal,
      role,
      display_name: displayName,
      display_role: displayRole,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to set author role: ${response.status}`);
  }
}

/**
 * Remove an author role via oracle-bridge.
 *
 * @throws Error if fetch fails or returns non-200
 * @see BL-008.7.2 Task 2.6 - Wire remove_author_role
 */
export async function removeAuthorRole(principal: string): Promise<void> {
  const oracleBridgeUrl = getOracleBridgeUrl();
  const response = await fetch(`${oracleBridgeUrl}/api/blog/remove-author-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ principal }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to remove author role: ${response.status}`);
  }
}

// =============================================================================
// Readiness Data (BL-008.7.2 Task 3)
// =============================================================================

/**
 * Fetch data needed for the readiness checklist:
 * - Published post count from the posts endpoint
 * - Category list with post counts from the categories endpoint
 *
 * @throws Error if fetch fails
 * @see BL-008.7.2 Task 3.2, 3.3 - Query post count and category coverage
 */
export async function fetchReadinessData(): Promise<ReadinessData> {
  const oracleBridgeUrl = getOracleBridgeUrl();

  const [postsRes, categoriesRes] = await Promise.all([
    fetch(`${oracleBridgeUrl}/api/blog/posts?page=1&page_size=100`, {
      credentials: 'include',
    }),
    fetch(`${oracleBridgeUrl}/api/blog/categories`, {
      credentials: 'include',
    }),
  ]);

  if (!postsRes.ok) {
    throw new Error('Failed to fetch posts for readiness check');
  }

  if (!categoriesRes.ok) {
    throw new Error('Failed to fetch categories for readiness check');
  }

  const postsData = await postsRes.json();
  const posts = postsData.posts || [];
  const publishedCount = posts.filter(
    (p: { status: string }) => p.status === 'Published',
  ).length;

  const categories = await categoriesRes.json();

  return {
    publishedPostCount: publishedCount,
    totalPosts: posts.length,
    categories,
  };
}

/**
 * Save a blog draft via oracle-bridge.
 *
 * Maps canister error responses to SaveResult error types:
 * - 409 + "modified in another session" -> StaleEdit
 * - 401/403 -> Unauthorized
 * - 413 -> PostTooLarge
 * - Other errors -> InternalError
 * - Network failures -> NetworkError
 */
export async function saveDraft(
  oracleBridgeUrl: string,
  postId: number,
  body: string,
  expectedUpdatedAt: number
): Promise<SaveResult> {
  try {
    const response = await fetch(`${oracleBridgeUrl}/api/blog/save-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id: postId,
        body,
        expected_updated_at: expectedUpdatedAt,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        updated_at: data.updated_at,
      };
    }

    // Handle error responses
    let errorData: { message?: string; error?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      // JSON parse may fail on some error responses
    }

    if (response.status === 409 && errorData.message?.includes('modified in another session')) {
      return {
        success: false,
        error: 'StaleEdit',
        message: errorData.message || 'This post was modified in another session. Reload to see latest changes.',
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'Your session has expired. Please re-authenticate.',
      };
    }

    if (response.status === 413) {
      return {
        success: false,
        error: 'PostTooLarge',
        message: errorData.message || 'Post content is too large.',
      };
    }

    return {
      success: false,
      error: 'InternalError',
      message: errorData.message || 'Something went wrong. Try again.',
    };
  } catch {
    return {
      success: false,
      error: 'NetworkError',
      message: 'Save failed. Check your network connection.',
    };
  }
}

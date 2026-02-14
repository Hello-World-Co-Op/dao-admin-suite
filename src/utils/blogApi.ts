/**
 * Blog API utilities for oracle-bridge communication
 *
 * Handles save_draft endpoint calls with proper error mapping
 * for auto-save functionality.
 *
 * @see BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 */

import type { SaveResult } from '@/hooks/useAutoSave';

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

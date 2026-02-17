/**
 * Roles Client - Platform role management API client
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 1: Create roles-client.ts service module
 *
 * Provides typed functions for interacting with oracle-bridge role management
 * endpoints. All calls require admin session cookie (credentials: 'include').
 *
 * @see AC2 - User list with roles
 * @see AC3 - Search filtering
 * @see AC5 - Role assignment
 * @see AC6 - Role revocation
 * @see AC9 - Audit log
 */

// --- Type Definitions (Task 1.1) ---

export interface UserWithRoles {
  user_id: string;
  display_name: string;
  email_preview: string;
  verified: boolean;
  submitted_at: string;
  roles: string[];
}

export interface PaginatedUsersResponse {
  users: UserWithRoles[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  user_role: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogResponse {
  entries: AuditEntry[];
  total: number;
}

export interface RoleChangeResponse {
  success: true;
  user_id: string;
  role: string;
  message: string;
}

// --- Error Class ---

export class RolesApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'RolesApiError';
  }
}

// --- Base URL (Task 1.7) ---

function getBaseUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

// --- API Functions ---

/**
 * List users with their platform roles, with optional search filtering.
 * Task 1.2
 *
 * @see AC2 - User list loads on page open
 * @see AC3 - Search input filters user list
 */
export async function listUsers(
  page: number,
  pageSize: number,
  search?: string,
): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) {
    params.set('search', search);
  }

  const response = await fetch(`${getBaseUrl()}/api/roles/users?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new RolesApiError('Your session has expired. Please log in again.', 401);
    }
    if (response.status === 403) {
      throw new RolesApiError('Access denied. Admin role required.', 403);
    }
    throw new RolesApiError(`Failed to fetch users: ${response.status}`, response.status);
  }

  return response.json();
}

/**
 * Get a single user's roles by user ID.
 * Task 1.3
 *
 * @see AC4 - User role panel shows user details
 */
export async function getUserRoles(userId: string): Promise<UserWithRoles> {
  const response = await fetch(`${getBaseUrl()}/api/roles/users/${encodeURIComponent(userId)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new RolesApiError('User not found', 404);
    }
    if (response.status === 401) {
      throw new RolesApiError('Your session has expired. Please log in again.', 401);
    }
    if (response.status === 403) {
      throw new RolesApiError('Access denied. Admin role required.', 403);
    }
    throw new RolesApiError(`Failed to fetch user roles: ${response.status}`, response.status);
  }

  return response.json();
}

/**
 * Assign a platform role to a user.
 * Task 1.4
 *
 * @see AC5 - Admin can assign admin, moderator, or developer role
 */
export async function assignRole(
  userId: string,
  role: 'admin' | 'moderator' | 'developer',
): Promise<RoleChangeResponse> {
  const response = await fetch(`${getBaseUrl()}/api/roles/assign`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, role }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const data = await response.json().catch(() => ({ error: 'Bad request' }));
      throw new RolesApiError(data.error || 'Invalid request', 400);
    }
    if (response.status === 401) {
      throw new RolesApiError('Your session has expired. Please log in again.', 401);
    }
    if (response.status === 403) {
      throw new RolesApiError('Access denied. Admin role required.', 403);
    }
    if (response.status === 404) {
      throw new RolesApiError('User not found', 404);
    }
    if (response.status === 503) {
      throw new RolesApiError('Role management service temporarily unavailable. Please try again.', 503);
    }
    throw new RolesApiError(`Failed to assign role: ${response.status}`, response.status);
  }

  return response.json();
}

/**
 * Revoke a platform role from a user.
 * Task 1.5
 *
 * @see AC6 - Admin can revoke admin, moderator, or developer role
 */
export async function revokeRole(
  userId: string,
  role: 'admin' | 'moderator' | 'developer',
): Promise<RoleChangeResponse> {
  const response = await fetch(`${getBaseUrl()}/api/roles/revoke`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, role }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const data = await response.json().catch(() => ({ error: 'Bad request' }));
      throw new RolesApiError(data.error || 'Invalid request', 400);
    }
    if (response.status === 401) {
      throw new RolesApiError('Your session has expired. Please log in again.', 401);
    }
    if (response.status === 403) {
      throw new RolesApiError('Cannot revoke your own admin role.', 403);
    }
    if (response.status === 404) {
      throw new RolesApiError('User not found', 404);
    }
    if (response.status === 503) {
      throw new RolesApiError('Role management service temporarily unavailable. Please try again.', 503);
    }
    throw new RolesApiError(`Failed to revoke role: ${response.status}`, response.status);
  }

  return response.json();
}

/**
 * Fetch the role audit log.
 * Task 1.6
 *
 * @see AC9 - Audit log tab shows recent role change history
 */
export async function getAuditLog(
  limit?: number,
  userId?: string,
): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  if (limit !== undefined) {
    params.set('limit', String(limit));
  }
  if (userId) {
    params.set('user_id', userId);
  }

  const queryString = params.toString();
  const url = `${getBaseUrl()}/api/roles/audit${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new RolesApiError('Your session has expired. Please log in again.', 401);
    }
    if (response.status === 403) {
      throw new RolesApiError('Access denied. Admin role required.', 403);
    }
    throw new RolesApiError(`Failed to fetch audit log: ${response.status}`, response.status);
  }

  return response.json();
}

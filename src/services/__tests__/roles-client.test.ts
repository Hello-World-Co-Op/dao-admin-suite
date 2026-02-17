/**
 * Tests for roles-client service module
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 1.8: Unit tests for all roles-client functions
 *
 * @see AC2 - User list with roles
 * @see AC3 - Search filtering
 * @see AC5 - Role assignment
 * @see AC6 - Role revocation
 * @see AC9 - Audit log
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listUsers,
  getUserRoles,
  assignRole,
  revokeRole,
  getAuditLog,
  RolesApiError,
} from '../roles-client';
import type {
  PaginatedUsersResponse,
  UserWithRoles,
  RoleChangeResponse,
  AuditLogResponse,
} from '../roles-client';

describe('roles-client', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listUsers', () => {
    it('fetches users with page and page_size params', async () => {
      const mockResponse: PaginatedUsersResponse = {
        users: [
          {
            user_id: 'user-1',
            display_name: 'Test User',
            email_preview: 'tes***@example.com',
            verified: true,
            submitted_at: '2026-01-15T14:30:00Z',
            roles: ['admin'],
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
        has_next: false,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await listUsers(1, 25);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/roles/users?page=1&page_size=25'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('includes search param when provided', async () => {
      const mockResponse: PaginatedUsersResponse = {
        users: [],
        total: 0,
        page: 1,
        page_size: 25,
        has_next: false,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      await listUsers(1, 25, 'test@example');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('search=test%40example'),
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('throws RolesApiError on 401', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      );

      try {
        await listUsers(1, 25);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(RolesApiError);
        expect((e as RolesApiError).message).toContain('session has expired');
      }
    });
  });

  describe('getUserRoles', () => {
    it('fetches a single user by ID', async () => {
      const mockUser: UserWithRoles = {
        user_id: 'user-1',
        display_name: 'Test User',
        email_preview: 'tes***@example.com',
        verified: true,
        submitted_at: '2026-01-15T14:30:00Z',
        roles: ['admin', 'moderator'],
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockUser), { status: 200 }),
      );

      const result = await getUserRoles('user-1');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/roles/users/user-1'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(result.display_name).toBe('Test User');
      expect(result.roles).toEqual(['admin', 'moderator']);
    });

    it('throws RolesApiError with 404 for unknown user', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Not Found', { status: 404 }),
      );

      try {
        await getUserRoles('nonexistent');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(RolesApiError);
        expect((e as RolesApiError).status).toBe(404);
        expect((e as RolesApiError).message).toBe('User not found');
      }
    });
  });

  describe('assignRole', () => {
    it('sends POST with user_id and role in JSON body', async () => {
      const mockResponse: RoleChangeResponse = {
        success: true,
        user_id: 'user-1',
        role: 'moderator',
        message: 'Role assigned successfully',
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await assignRole('user-1', 'moderator');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/roles/assign'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 'user-1', role: 'moderator' }),
        }),
      );
      expect(result.success).toBe(true);
      expect(result.role).toBe('moderator');
    });

    it('throws RolesApiError on 403 (self-revoke guard)', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Forbidden', { status: 403 }),
      );

      try {
        await assignRole('self-id', 'admin');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(RolesApiError);
        expect((e as RolesApiError).status).toBe(403);
      }
    });

    it('throws RolesApiError on 503 (service unavailable)', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Service Unavailable', { status: 503 }),
      );

      try {
        await assignRole('user-1', 'developer');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(RolesApiError);
        expect((e as RolesApiError).status).toBe(503);
        expect((e as RolesApiError).message).toContain('temporarily unavailable');
      }
    });
  });

  describe('revokeRole', () => {
    it('sends POST to revoke endpoint with correct body', async () => {
      const mockResponse: RoleChangeResponse = {
        success: true,
        user_id: 'user-1',
        role: 'developer',
        message: 'Role revoked successfully',
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await revokeRole('user-1', 'developer');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/roles/revoke'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ user_id: 'user-1', role: 'developer' }),
        }),
      );
      expect(result.success).toBe(true);
    });

    it('throws RolesApiError on 400 with error message from body', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Role not assigned' }), { status: 400 }),
      );

      try {
        await revokeRole('user-1', 'admin');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(RolesApiError);
        expect((e as RolesApiError).status).toBe(400);
        expect((e as RolesApiError).message).toBe('Role not assigned');
      }
    });
  });

  describe('getAuditLog', () => {
    it('fetches audit log without params', async () => {
      const mockResponse: AuditLogResponse = {
        entries: [
          {
            id: 'audit-1',
            action: 'ROLE_ASSIGNED',
            table_name: 'user_roles',
            record_id: 'user-1',
            user_role: 'admin',
            details: { role: 'moderator', performed_by: 'admin-user' },
            created_at: '2026-02-17T10:30:00Z',
          },
        ],
        total: 1,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await getAuditLog();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/roles/audit'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].action).toBe('ROLE_ASSIGNED');
    });

    it('includes user_id filter param when provided', async () => {
      const mockResponse: AuditLogResponse = {
        entries: [],
        total: 0,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      await getAuditLog(50, 'target-user-id');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('user_id=target-user-id'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('throws RolesApiError on 401', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      );

      await expect(getAuditLog()).rejects.toThrow(RolesApiError);
    });
  });
});

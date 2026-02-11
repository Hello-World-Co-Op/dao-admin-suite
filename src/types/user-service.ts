/**
 * Type definitions for user-service canister
 *
 * Admin-relevant subset of types from the user-service canister.
 * These types are used by KYC review components and admin workflows.
 *
 * Bridge pattern: These types are extracted from the frontend monolith.
 * If @hello-world-co-op/api exports these types in the future,
 * this file can be replaced with re-exports from the shared package.
 */

import type { Principal } from '@dfinity/principal';

// KYC types (Epic 2.0)
export type KYCStatus =
  | { Pending: null }
  | { Verified: null }
  | { Failed: null }
  | { Expired: null }
  | { UnderReview: null };

export interface KYCRecord {
  user_id: Principal;
  inquiry_id: string;
  status: KYCStatus;
  created_at: bigint;
  updated_at: bigint;
  verified_at: [bigint] | [];
  expiry_date: [bigint] | [];
  // Story 2.0.4: Admin review and appeal fields
  flagged_at: [bigint] | [];
  reviewer: [Principal] | [];
  review_notes: [string] | [];
  appeal_reason: [string] | [];
  appeal_submitted_at: [bigint] | [];
}

// Story 2.0.4: Admin review types
export type ReviewDecision = { Approved: null } | { Rejected: null };

export interface AuditEntry {
  timestamp: bigint;
  actor: Principal;
  action: string;
  target: string;
  decision: [ReviewDecision] | [];
  notes: string;
}

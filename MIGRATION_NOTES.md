# Migration Notes: dao-admin-suite

## Source

Admin components extracted from the frontend monolith (`frontend/app/www/src/`).

## What Was Extracted

### Components
- `components/admin/KYCReviewDashboard` - Review queue with SLA status indicators
- `components/admin/KYCReviewDetail` - Case detail panel with Persona inquiry data
- `components/admin/KYCReviewPage` - Full review page combining dashboard and detail

### Pages
- `AdminDashboard` - New admin landing page (not in monolith)
- `KYCManagement` - Delegates to KYCReviewPage
- `LoginRedirect` - Adapted from dao-suite for admin-specific routes
- Placeholder pages: MemberManagement, GovernanceOversight, TreasuryManagement, SystemMonitoring, ContentModeration

### Utilities
- `analytics.ts` - Simplified from monolith (removed notification-specific tracking)
- `cn.ts` - clsx wrapper (same as monolith)
- `logger.ts` - Adapted from dao-suite
- `validateReturnUrl.ts` - Admin-specific allowed prefixes (/kyc, /members, /governance, /treasury, /monitoring, /moderation)

### Types
- `user-service.ts` - Admin-relevant subset (KYCRecord, KYCStatus, ReviewDecision, AuditEntry)

## Changes from Source

### SLA Status Display
- **Monolith**: Used emoji-prefixed text (checkmark for Good, warning for Warning, cross for Breached)
- **Admin Suite**: Uses plain text ("Good", "Warning", "Breached") for better accessibility and test reliability

### Import Paths
- All imports updated from relative paths (`../../utils/`) to `@/` path aliases

### Auth Pattern
- Uses `useAdminAuth` hook instead of monolith's global auth context
- `ProtectedRoute` simplified - no token refresh logic (deferred to auth package integration)
- All routes require auth except `/login` (LoginRedirect)

### validateReturnUrl
- Allowed prefixes changed to admin routes: `/kyc`, `/members`, `/governance`, `/treasury`, `/monitoring`, `/moderation`
- Default redirect is `/` (root) instead of `/dashboard`

### Dev Server Port
- Admin suite runs on port **5176** (monolith: 5173, dao-suite: 5174)

## Shared Package Dependencies

Uses `file:` references for local development:
- `@hello-world-co-op/api` -> `file:../api`
- `@hello-world-co-op/auth` -> `file:../auth`
- `@hello-world-co-op/ui` -> `file:../ui`

## Bridge Pattern Components

The following components use the bridge pattern and can be replaced with shared package imports in the future:

- `ErrorBoundary` - Can migrate to `@hello-world-co-op/ui` ErrorBoundary
- `ProtectedRoute` - Can delegate to `@hello-world-co-op/auth` useAuth
- `cn.ts` - Can migrate to `@hello-world-co-op/ui` cn utility
- `analytics.ts` - Can migrate to shared analytics package

## Test Migration

All tests migrated with the following changes:
- Updated import paths to `@/` aliases
- Updated SLA status text assertions (emoji -> plain text)
- Added tests for admin-specific functionality (validateReturnUrl, LoginRedirect, App routing)
- Co-located test files with their components

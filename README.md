# dao-admin-suite

DAO Admin Dashboard - Authenticated admin area for KYC review, member management, system monitoring, governance oversight, treasury management, and content moderation.

## Architecture

This suite follows the **Shared Packages + Bridge Pattern** architecture:

- **@hello-world-co-op/api** - API client for canister interactions
- **@hello-world-co-op/auth** - Authentication utilities and session management
- **@hello-world-co-op/ui** - Shared UI components and Tailwind config

Suite-specific components use the **bridge pattern**: local implementations that can be replaced with shared package imports as they become available.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Sibling repos cloned: `api`, `auth`, `ui`

### Development

```bash
# Install dependencies
npm install

# Start dev server (port 5176)
npm run dev

# Start with auth bypass for development
npm run dev:qa
```

### Testing

```bash
# Run unit tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Building

```bash
# Type check + build
npm run build

# Lint
npm run lint
```

## Routes

All routes require authentication via `ProtectedRoute` except `/login`.

| Route | Page | Description |
|-------|------|-------------|
| `/` | AdminDashboard | Main admin landing with section cards |
| `/kyc` | KYCManagement | KYC review queue and detail panels |
| `/members` | MemberManagement | Member approvals and status management |
| `/governance` | GovernanceOversight | Proposal and voting oversight |
| `/treasury` | TreasuryManagement | Payout approvals and escrow operations |
| `/monitoring` | SystemMonitoring | Canister health and system metrics |
| `/moderation` | ContentModeration | User-generated content review |
| `/login` | LoginRedirect | Redirects to FounderyOS for authentication |

## Authentication

Authentication is handled by FounderyOS. When an unauthenticated user visits any protected route:

1. `ProtectedRoute` detects no auth and redirects to `/login`
2. `LoginRedirect` redirects to FounderyOS login with a `returnUrl` back to the admin suite
3. After authentication, FounderyOS redirects the user back

### RBAC Enforcement

This suite enforces role-based access control (RBAC) using the platform-wide role system:

- **Required Role:** Admin (assigned in `auth-service` canister)
- **Enforcement:** `RoleGuard role="admin"` wraps all routes except `/login` and `/unauthorized`
- **Unauthorized Access:** Users without Admin role are redirected to `/unauthorized` page
- **Session-Based:** Roles are cached in session tokens at login time (changes take effect on next login)

**Integration:**
- Uses `@hello-world-co-op/auth@^0.2.0` for `<RoleGuard>` and `useRoles()` hook
- All protected routes wrapped in `<RoleGuard role="admin">`
- Admin-specific `validateReturnUrl()` prevents open redirect attacks

**For developers:**
- See [RBAC Integration Guide](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/rbac-integration.md) for full RBAC documentation
- Admin role assignment: `dfx canister call auth-service assign_role '("user-id", variant { Admin })'`
- Role debugging: See [FAS Troubleshooting - RBAC section](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-troubleshooting.md#rbac-issues)

## Project Structure

```
src/
  components/
    admin/
      KYCReviewDashboard/    # Review queue with SLA indicators
      KYCReviewDetail/       # Case detail panel with approve/reject
      KYCReviewPage/         # Full KYC review page (dashboard + detail)
    ErrorBoundary.tsx        # App-level error handling
    ProtectedRoute.tsx       # Auth guard wrapper
  hooks/
    useAdminAuth.ts          # Admin authentication state hook
  pages/
    AdminDashboard.tsx       # Main admin landing page
    KYCManagement.tsx        # KYC management page
    LoginRedirect.tsx        # FounderyOS login redirect
    ...                      # Placeholder pages
  types/
    user-service.ts          # KYC and user type definitions
  utils/
    analytics.ts             # Event tracking
    cn.ts                    # Class name utility
    logger.ts                # Development logging
    validateReturnUrl.ts     # Open redirect prevention
  App.tsx                    # Root component with routing
  main.tsx                   # Entry point
e2e/
  specs/                     # Playwright E2E test specs
```

## CI/CD

- **ci.yml** - Lint, typecheck, test, build, E2E on PRs and main pushes
- **deploy-staging.yml** - Deploy to IC staging on main push

## FAS Developer Documentation

This suite is part of the [Frontend Application Split (FAS)](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-architecture.md) project. It uses the **Auth Bridge pattern** with AdminGuard for RBAC.

- [FAS Architecture Overview](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-architecture.md) -- Package/suite architecture, dependency diagram, CI/CD pipeline
- [FAS Repository Map](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-repository-map.md) -- All FAS repos and "where do I make changes?"
- [FAS Local Setup Guide](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-local-setup.md) -- Suite-specific setup (requires oracle-bridge)
- [FAS Auth Debugging](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-auth-debugging.md) -- Cross-suite SSO troubleshooting
- [FAS Troubleshooting](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-troubleshooting.md) -- Common issues and fixes (see SSO section)
- [FAS Rollback Procedures](https://github.com/Hello-World-Co-Op/docs/blob/main/developer/fas-rollback-procedures.md) -- Suite-specific rollback steps

## Related Stories

- **FAS-7.1** - Create and Deploy dao-admin-suite (this repo)
- **FAS-7.2** - AdminGuard RBAC enforcement (depends on bl-007)

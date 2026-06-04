# Implementation Plan: Fallow Complexity Refactor

## Approach
- **Why this solution:** We are adopting an **Incremental Domain-Driven Refactor** approach. Instead of a single massive "Big Bang" PR, we will tackle the technical debt domain by domain. This minimizes merge conflict risks, makes PRs easier to review, and ensures we can validate each segment (e.g., Orders, Auth, Payments) independently before moving to the next.
- **Alternatives considered:** A Holistic Branch Refactor was considered but discarded due to the high risk associated with an 18,000+ LOC codebase and the potential for a massive, unreviewable diff.

## Tracks & Steps

### 1. Track 1: Backend Core (Orders & Payments)
*   **Root Cause:** `OrdersService` is a 646 LOC God object handling everything from creation to analytics. `handleStripeWebhook` is a 115 LOC complex monolith.
*   **Investigation:** Verified `OrdersService` has 18 nodes (methods) handling disparate concerns.
*   **Fix Plan:**
    *   **Orders:** Extract `OrderCreationService`, `OrderValidationService`, `OrderAnalyticsService`, and `OrderEventsService`. Have `OrdersService` act as a facade/coordinator.
    *   **Payments:** Create a `WebhookEventDispatcher` and separate handlers (`handlePaymentSucceeded`, `handlePaymentFailed`, etc.) in `payment-service`.
    *   **Testing:** Add critical path tests for order creation and stripe webhooks.

### 2. Track 2: Authentication & Routing
*   **Root Cause:** `ClerkAuthGuard` has complex decision logic (`canActivate` has 16 cyclomatic complexity). `proxy.ts` uses imperative routing (18 cyclomatic complexity).
*   **Investigation:** Verified `clerk.guard.ts` and `proxy.ts` are monolithic.
*   **Fix Plan:**
    *   **Auth:** Break down `canActivate` into `extractToken`, `validateToken`, and `checkRoles`.
    *   **Routing:** Refactor `proxy.ts` to use a configuration array `const ROUTES = [{ matcher: '/admin', roles: ['ADMIN'] }]`.
    *   **Testing:** Test role sync and guard logic.

### 3. Track 3: Frontend Composition (Dashboards)
*   **Root Cause:** `CustomerDashboard` (235 LOC), `SellerDashboard` (193 LOC), and `AdminAnalyticsPage` (165 LOC) mix data fetching, UI state, and presentation.
*   **Fix Plan:**
    *   Extract smaller components into a `dashboard/` subfolder (e.g., `dashboard-header.tsx`, `dashboard-stats.tsx`, `recent-orders.tsx`).
    *   Compose pages using these smaller components.

### 4. Track 4: Hotspots & Housekeeping
*   **Root Cause:** Unused dependencies bloat the project. High churn files like `users.service.ts` (220 LOC) are showing signs of becoming God objects.
*   **Fix Plan:**
    *   Run `pnpm dlx fallow unused-deps` and remove unused packages.
    *   Review `users.service.ts` for early extraction opportunities (e.g., separating clerk synchronization from standard user management).

## Timeline
| Phase | Expected Effort |
|-------|----------|
| Track 1 (Backend Core) | High |
| Track 2 (Auth & Routing) | Medium |
| Track 3 (Frontend UI) | Medium |
| Track 4 (Housekeeping) | Low |

## Rollback Plan
Since we are using incremental branches, rollback is handled naturally via Git. If a domain refactor fails in CI or causes issues in staging, we can revert the specific PR without blocking other domains.

## Security Checklist
- [ ] Ensure Auth Guards remain impenetrable after refactor.
- [ ] Verify Stripe webhook signatures are still validated in the new dispatcher.
- [ ] Ensure Clerk user metadata sync retains correct role mapping.

## Task Checklist
- [ ] Implement Track 1 (Orders & Payments)
- [ ] Implement Track 2 (Auth & Routing)
- [ ] Implement Track 3 (Frontend UI)
- [ ] Implement Track 4 (Housekeeping)

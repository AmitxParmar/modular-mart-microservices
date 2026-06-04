# Tracks Registry

This registry tracks the active refactoring domains for the Fallow Complexity Refactor.

## Active Tracks

### Track 1: Backend Core (Orders & Payments)
- **Status:** Pending
- **Plan:** `conductor/refactoring-plan.md`
- **Tasks:**
  - [ ] Extract `OrderCreationService`, `OrderValidationService`, `OrderAnalyticsService`, and `OrderEventsService`.
  - [ ] Create `WebhookEventDispatcher` in payment-service.
  - [ ] Add tests for order creation and stripe webhooks.

### Track 2: Authentication & Routing
- **Status:** Pending
- **Plan:** `conductor/refactoring-plan.md`
- **Tasks:**
  - [ ] Break down `ClerkAuthGuard.canActivate`.
  - [ ] Refactor `proxy.ts` routing logic.
  - [ ] Test role sync and guard logic.

### Track 3: Frontend Composition (Dashboards)
- **Status:** Pending
- **Plan:** `conductor/refactoring-plan.md`
- **Tasks:**
  - [ ] Extract components for `CustomerDashboard`.
  - [ ] Extract components for `SellerDashboard`.
  - [ ] Extract components for `AdminAnalyticsPage`.

### Track 4: Hotspots & Housekeeping
- **Status:** Pending
- **Plan:** `conductor/refactoring-plan.md`
- **Tasks:**
  - [ ] Remove unused dependencies (`fallow unused-deps`).
  - [ ] Review `users.service.ts` for extraction.
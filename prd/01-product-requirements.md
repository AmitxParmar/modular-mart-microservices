# Modular Mart - Product Requirements

## User Roles

### 1. Customer

- **Description**: End-user shopping on the platform
- **Permissions**:
  - Browse products and categories
  - Add items to cart (client-side persistence)
  - Complete purchases via Stripe
  - View order history and tracking
  - Manage profile and addresses
  - Receive real-time notifications (SSE)
- **Authentication**: Email/password via Clerk

### 2. Seller

- **Description**: Independent vendors selling products on the platform
- **Permissions**:
  - Register as seller via dedicated onboarding
  - List products for approval by administrators
  - Manage inventory levels for their products
  - View sales analytics and earnings dashboards
  - Process orders and update shipping status
- **Authentication**: Clerk-based with `SELLER` role assignment

### 3. Administrator

- **Description**: Platform management and oversight
- **Permissions**:
  - Manage all users and role assignments
  - Approve or reject seller product submissions
  - View system-wide analytics and logs (via Grafana)
  - Manage notification templates and platform settings
- **Authentication**: Admin-only access with RBAC

### 4. System (Internal)

- **Description**: Automated services and event-driven logic
- **Permissions**:
  - Process payments and handle webhooks
  - Deliver multi-channel notifications
  - Synchronize inventory across domains
  - Execute background outbox processing

## Core Features

### 1. User & Identity Management
- **Identity Provider**: Offloaded to Clerk for secure auth.
- **Profile Syncing**: Automatic synchronization between Clerk and local User Service.
- **RBAC**: Role-based access control (Customer, Seller, Admin) enforced across all services.

### 2. Multi-vendor Product Catalog
- **Catalog Isolation**: Separate domains for products and categories.
- **Seller Hub**: Dedicated interface for sellers to manage their listings.
- **Approval Workflow**: Products must be approved by an Admin before appearing in the storefront.
- **Inventory Integrity**: Pessimistic locking in the database prevents overselling.

### 3. Order Management & Saga
- **Atomic Checkout**: Transactional Outbox pattern ensures order creation and inventory reservation are atomic.
- **Order Splitting**: Orders containing items from multiple sellers are split for accurate tracking.
- **Tracking Timeline**: Real-time status updates from `PENDING_STOCK` to `DELIVERED`.

### 4. Real-time Notifications
- **Multi-channel**: Delivery via Email and In-App notifications.
- **SSE Stream**: Live UI updates for order status changes and system alerts.
- **Preferences**: Users can opt-in/out of specific notification channels.

### 5. Observability (LGTM Stack)
- **Centralized Logs**: All services stream JSON logs to Loki.
- **Metrics**: Real-time throughput and error rate tracking via Prometheus.
- **Traces**: Distributed tracing via Jaeger for cross-service request visualization.

## User Journeys

### Journey 1: Customer Purchase
1. Browse products with advanced filters.
2. Add items to cart (client-side store).
3. Checkout: Select address and confirm payment method.
4. Payment: Securely pay via Stripe Elements.
5. Post-purchase: Receive real-time confirmation via SSE and email.
6. Track order timeline as the seller processes the items.

### Journey 2: Seller Onboarding & Selling
1. Log in and access the Seller Dashboard.
2. Create new product listing with detailed metadata.
3. Wait for Admin approval (notified via SSE/Email).
4. Monitor dashboard for new orders.
5. Process orders: Update status to `PROCESSING` and then `SHIPPED`.
6. Track earnings and product performance in real-time.

## Success Metrics (Updated)

- **Order Processing Speed**: < 2 seconds from checkout to stock reservation.
- **Saga Reliability**: 99.9% event delivery success via Outbox pattern.
- **Observability Coverage**: 100% of services integrated with LGTM.
- **Seller Satisfaction**: Onboarding to first sale in < 24 hours.

## Edge Cases

- **Concurrency**: Handled via Pessimistic Locking in Catalog Service.
- **Payment Failure**: Compensation logic in the Saga releases reserved stock automatically.
- **Idempotency**: All consumers deduplicate messages via `processed_messages` to prevent double-processing.

## User Journeys

### Journey 1: First-time Purchase

```
1. Browse products → Search/filter catalog
2. View product details → Check availability and reviews
3. Add to cart → Select quantity and variants
4. Proceed to checkout → Login/register if needed
5. Enter shipping address → Validate and save
6. Select payment method → Secure payment processing
7. Review order → Confirm details and totals
8. Complete purchase → Receive confirmation
9. Track order → Status updates via email/UI
```

### Journey 2: Returning Customer

```
1. Login → Quick access to profile
2. Browse recommendations → Personalized suggestions
3. Reorder from history → One-click reorder
4. Update cart → Modify quantities
5. Use saved address → Faster checkout
6. Apply loyalty points → Discounts and rewards
7. Complete purchase → Streamlined flow
```

### Journey 3: Seller Registration (Future)

```
1. Apply as seller → Submit business details
2. Verification → Document validation
3. Set up store → Branding and policies
4. Add products → Inventory and pricing
5. Configure shipping → Rates and regions
6. Go live → Store activation
7. Manage orders → Fulfillment and customer service
```

## Acceptance Criteria

### Feature: Product Browsing

**AC-1.1**: Users can view all products in a category

- Given a category is selected
- When the user views the category page
- Then they see all available products with images, names, and prices
- And products are paginated (20 per page)

**AC-1.2**: Users can search for products

- Given the user enters a search term
- When they submit the search
- Then relevant products are displayed
- And search results include product name, description, and category matches

**AC-1.3**: Users can filter products

- Given multiple filter options are available
- When the user applies filters
- Then the product list updates accordingly
- And applied filters are clearly displayed

### Feature: Shopping Cart

**AC-2.1**: Users can add items to cart

- Given a product is available
- When the user clicks "Add to Cart"
- Then the item is added to their cart
- And cart count updates in real-time

**AC-2.2**: Users can modify cart contents

- Given items are in the cart
- When the user updates quantities
- Then the cart total recalculates
- And inventory availability is validated

**AC-2.3**: Guest carts persist

- Given a user is not logged in
- When they add items to cart
- Then the cart persists across browser sessions
- And can be merged upon login

### Feature: Checkout Process

**AC-3.1**: Multi-step checkout flow

- Given items are in the cart
- When the user proceeds to checkout
- Then they go through address → payment → confirmation steps
- And can navigate back to previous steps

**AC-3.2**: Address validation

- Given a shipping address is entered
- When the address is submitted
- Then it is validated for completeness
- And saved to the user's address book if requested

**AC-3.3**: Payment processing

- Given payment details are provided
- When the payment is submitted
- Then it is processed via Stripe
- And the user receives immediate confirmation

### Feature: Order Management

**AC-4.1**: Order status tracking

- Given an order is placed
- When the order status changes
- Then the user is notified
- And can view current status in their account

**AC-4.2**: Order history

- Given a user has placed orders
- When they view their order history
- Then they see all past orders
- And can filter by date, status, or amount

**AC-4.3**: Order cancellation

- Given an order is in PENDING status
- When the user requests cancellation
- Then the order is cancelled within 30 minutes
- And payment is refunded if already processed

## Success Metrics

### User Experience Metrics

- **Cart Abandonment Rate**: < 60%
- **Checkout Completion Rate**: > 40%
- **Average Order Value**: $75+
- **Customer Satisfaction**: > 4.5/5.0

### Technical Metrics

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms (p95)
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%

### Business Metrics

- **Conversion Rate**: > 3%
- **Repeat Purchase Rate**: > 30%
- **Customer Lifetime Value**: $200+
- **Monthly Active Users**: 10,000+

## Edge Cases

### Inventory Management

- **Scenario**: Two users attempt to purchase the last item simultaneously
- **Requirement**: Pessimistic locking prevents overselling
- **Fallback**: Waitlist or backorder notification

### Payment Failures

- **Scenario**: Payment processor is unavailable
- **Requirement**: Graceful degradation with retry logic
- **Fallback**: Save order as PENDING and notify user

### Network Issues

- **Scenario**: User loses connection during checkout
- **Requirement**: Idempotent operations prevent duplicate charges
- **Fallback**: Order recovery on reconnection

### Data Consistency

- **Scenario**: Service failure during distributed transaction
- **Requirement**: Saga pattern with compensation actions
- **Fallback**: Manual reconciliation process

---

_Last Updated: 2026-05-09_  
_Document Version: 1.0_

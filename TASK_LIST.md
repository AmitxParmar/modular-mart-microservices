# 🚀 Modular Mart: Microservices Task List

This document outlines the current state of the architecture and the remaining modules required to build a production-grade e-commerce ecosystem.

## 🏗️ Current Architecture Overview
The following services and packages are already implemented:

- **Apps**
  - `api-gateway`: Central entry point with JWT validation & routing.
  - `user-service`: User management and Clerk synchronization.
  - `catalog-order-service`: Core business logic for products and order placement.
  - `web`: Next.js storefront.
  - `docs`: Technical documentation.
- **Shared Packages**
  - `auth`: Shared authentication utilities.
  - `database`: Prisma/TypeORM configurations and migrations.
  - `contracts`: Shared TypeScript interfaces and DTOs.
  - `common`: Logging, error handling, and message bus (RabbitMQ) helpers.

---

## 🛠️ Remaining Roadmap

### 1. Payment Service (Critical)
*Goal: Handle financial transactions securely and asynchronously.*
- [ ] **Stripe Integration**: Implement checkout sessions and payment intent handling.
- [ ] **Webhook Listener**: Listen for Stripe events (`payment_intent.succeeded`) to trigger order updates.
- [ ] **Saga Participant**: Emit `PAYMENT_COMPLETED` or `PAYMENT_FAILED` events to RabbitMQ.
- [ ] **Refund Logic**: Handle automated refunds if inventory fulfillment fails.

### 2. Cart Service (High Priority)
*Goal: Manage temporary shopping sessions with high performance.*
- [ ] **Implementation Choice**: 
  - *Recommendation*: **Redis-based service**. Faster than Postgres for high-frequency cart updates and allows session TTL (Time-To-Live).
- [ ] **Merge Logic**: Merge guest carts (LocalStorage) with user accounts upon login.
- [ ] **Inventory Reservation**: Integration with Catalog to "soft-reserve" items for a limited time.

### 3. Notification Service (Essential for UX)
*Goal: Decoupled communication with customers.*
- [ ] **Email Integration**: (Resend / SendGrid / NodeMailer) for order confirmations.
- [ ] **RabbitMQ Consumer**: Listen for `ORDER_CREATED`, `PAYMENT_SUCCESS`, and `SHIPPING_UPDATE` events.
- [ ] **Template Engine**: Dynamic HTML templates for branded emails.

### 4. Shipping & Logistics Service (Expansion)
*Goal: Track order fulfillment and carrier integration.*
- [ ] **Status Tracking**: Transition orders through `PACKING`, `SHIPPED`, and `DELIVERED`.
- [ ] **Carrier Mock/Integration**: Basic logic for calculating shipping costs and generating dummy tracking IDs.

### 5. Infrastructure & Observability (Reliability)
- [ ] **Centralized Logging**: Implement ELK Stack (Elasticsearch, Logstash, Kibana) or Seq for cross-service log correlation.
- [ ] **Metrics & Monitoring**: Prometheus and Grafana dashboards for service health.
- [ ] **Load Testing**: Validate the "Flash Sale" scenario (Pessimistic Locking performance).

### 6. Frontend Enhancements
- [ ] **Checkout Flow**: Multi-step checkout UI (Shipping -> Payment -> Confirmation).
- [ ] **Order History**: Dashboard for users to track their previous purchases.
- [ ] **Real-time Notifications**: Toast notifications for order status changes via WebSockets (Socket.io).

---

> [!TIP]
> **Priority Suggestion**: Focus on the **Cart Service (Redis)** next, as it completes the "Browse to Checkout" user journey.

---
*Last Updated: 2026-05-03*

# 🚀 Modular Mart: Microservices Task List

This document tracks the tasks for transitioning to a production-grade, event-driven microservices architecture.

## 🏗️ Roadmap & Progress Checklist

### 🏁 Phase 1: Service Extraction
- [x] **Catalog Service Extraction**: Decouple products/categories to `catalog-service` with its own database.
- [x] **Order Service Extraction**: Relocate order processing to `order-service` and drop direct DB schema imports.
- [x] **Payment Service Extraction**: Decouple Stripe checkout and webhook handling to `payment-service`.
- [x] **API Gateway Alignment**: Route and proxy client requests dynamically to the correct downstream microservice.
- [x] **Storefront Integration**: Update the Next.js frontend to handle the decoupled HTTP routes and JWT claims.

---

### 🔄 Phase 2: Asynchronous Saga (Checkout & Stock Reservation)
- [x] **State Machine Extension**: Introduce intermediate order statuses (`PENDING_STOCK`, `STOCK_CONFIRMED`, `STOCK_FAILED`, `PAYMENT_PENDING`).
- [x] **Order Service Consumers**: Register event patterns for `STOCK_RESERVED` and `STOCK_RESERVE_FAILED`.
- [ ] **Catalog Service Saga Integration**: Evolve the reservation service to listen to reservation requests and publish reservation status events asynchronously.
- [ ] **Compensation Logic (Rollbacks)**: Verify automatic refunding and order cancellation when reservations fail.

---

### 🛡️ Phase 3: Reliability & Resiliency Patterns
- [ ] **Idempotent Consumers**: Implement message deduplication using a `processed_messages` schema to prevent double-processing.
- [ ] **Transactional Outbox Pattern**: Insert order states and outbox events in a single transaction to guarantee event delivery.
- [ ] **Retry Policies & DLQs**: Set up dead-letter exchanges and queues in RabbitMQ to handle transient errors gracefully.
- [ ] **Distributed Tracing**: Standardize payloads to carry `correlationId`, `traceId`, and `causationId` for easy debugging.

---

### 📢 Phase 4: Operations & Integrations
- [ ] **Notification Service**: Build a lightweight email dispatch service consuming order/payment success events.
- [ ] **API Gateway Circuit Breakers**: Protect API Gateway routes with circuit breakers to fail-fast under heavy loads.
- [ ] **Inventory Service Extraction**: Decouple inventory/stock management from the general catalog (optional DDD portfolio expansion).

---
*Last Updated: May 19, 2026*

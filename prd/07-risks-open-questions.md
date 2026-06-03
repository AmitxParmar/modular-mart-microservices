# Modular Mart - Risks & Open Questions

## Resolved Decisions

### 1. REST vs GraphQL
- **Decision**: REST (Implemented).
- **Rationale**: Provides better tooling for reverse proxying (http-proxy-middleware) and simpler caching at the gateway level. GraphQL may be evaluated later for complex Admin analytics.

### 2. Multi-vendor Strategy
- **Decision**: Multi-vendor Marketplace (Implemented).
- **Rationale**: The platform now supports dedicated Seller roles, product approval workflows, and seller-specific order dashboards.

### 3. Database Isolation
- **Decision**: Database-per-Service (Implemented).
- **Rationale**: Total isolation confirmed via isolated PostgreSQL containers in Docker. Cross-domain queries are strictly forbidden; data sharing happens via RabbitMQ and `@repo/contracts`.

### 4. Checkout Reliability
- **Decision**: Transactional Outbox + Choreographed Saga (Implemented).
- **Rationale**: Eliminates the dual-write problem and provides a robust, scalable way to handle distributed stock reservation and payment.

---

## Current Risks

### 1. Observability Overhead
- **Risk**: The LGTM stack (Loki/Prom/Jaeger) consumes significant local resources.
- **Mitigation**: Use lightweight configs and disable tracing for non-critical services in lower environments.

### 2. Seller Data Consistency
- **Risk**: High-concurrency inventory updates from multiple sellers could lead to database contention.
- **Mitigation**: **Pessimistic Locking** is implemented in the Catalog Service to ensure atomic stock decrements.

### 3. Third-party Availability
- **Risk**: Dependence on Clerk (Auth) and Stripe (Payments).
- **Mitigation**: Implemented robust webhook handlers with idempotency guards and retries.

---

_Last Updated: 2026-05-09_  
_Document Version: 1.0_

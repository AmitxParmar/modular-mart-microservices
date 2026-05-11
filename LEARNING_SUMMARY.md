# Learning Summary: Microservices & Architecture

This document summarizes the technical architecture, communication patterns, and identified improvement areas for the Modular Mart project.

## 1. Microservices Communication Pattern

### Current Implementation: Hybrid Approach
The project utilizes a hybrid communication model to balance immediate consistency with scalability.

*   **Synchronous (REST/HTTP):** Used for client-facing requests. The **API Gateway** acts as the entry point, routing requests to services like `user-service` or `catalog-order-service`.
*   **Asynchronous (RabbitMQ):** This is the core engine for inter-service communication and distributed transactions (Sagas).
    *   **Pattern:** Asynchronous Choreography.
    *   **Usage:** When a payment is processed in the `catalog-order-service`, it emits a `PAYMENT_SUCCEEDED` event via RabbitMQ. Other modules (like the Order module) listen for this to update the order status.
    *   **Contracts:** Shared event patterns and payloads are maintained in the `@repo/contracts` package to ensure type safety across services.

### Needed Improvements
*   **Dead Letter Queues (DLQ):** Implement DLQs to handle failed messages and retries gracefully.
*   **Saga Orchestration:** While choreography is used now, moving to an Orchestrator pattern for complex flows (like multi-service checkouts) could improve visibility.
*   **Idempotency:** Ensure all event consumers are strictly idempotent to prevent duplicate processing if a message is redelivered.
*   **Distributed Tracing:** Implementing OpenTelemetry to trace a single request as it hops across multiple services and queues.

---

## 2. Database Optimization

### Current Implementation
*   **Database-per-Service:** Each microservice owns its own PostgreSQL instance, ensuring loose coupling.
*   **Basic Indexing:** Standard indexes on Primary Keys and Foreign Keys.

### Needed Improvements
*   **Audit Trail:** Adding `created_by`, `updated_by`, and `deleted_at` columns to all critical tables for better tracking.
*   **Composite Indexes:** Optimizing queries that filter by multiple columns (e.g., `user_id` + `status` in the `orders` table).
*   **Table Partitioning:** Partitioning large historical tables like `orders` and `payments` by date (monthly) to maintain performance.
*   **Constraints:** Adding database-level check constraints (e.g., `price > 0`, `quantity > 0`) to prevent data corruption.
*   **Read Replicas:** Setting up master-replica architecture to offload read-heavy analytics queries from the primary database.

---

## 3. Project Design

### Current Implementation
*   **Monorepo:** Managed with **Turborepo** for shared packages (ui, contracts, common) and services.
*   **API Gateway:** A central NestJS service for routing, auth validation (Clerk), and rate limiting.
*   **Containerization:** Full Docker support for local development and deployment.

### Needed Improvements
*   **Caching Strategy:** Implementing a multi-layer cache using **Redis** for frequently accessed product data and user sessions.
*   **Error Handling:** Standardizing domain-specific error classes across all services for consistent API responses.
*   **Background Jobs:** Utilizing workers for non-critical tasks like image processing or generating reports (offloading from the main request loop).
*   **Chaos Engineering:** Testing system resilience by intentionally injecting failures (e.g., shutting down RabbitMQ or a database) to see how the system recovers.
*   **Strict Typing:** Enhancing TypeScript usage with "Branded Types" for domain IDs (e.g., `UserId`, `OrderId`) to prevent logic errors.

---

## 4. RabbitMQ: Are we using it?
**Yes.** RabbitMQ is essential to this project for:
1.  **Decoupling:** Services don't need to know about each other's internals; they just react to events.
2.  **Reliability:** Events are queued, so if a service is temporarily down, it can process missed events once it recovers.
3.  **Saga Pattern:** Managing the state transitions of an Order from `PENDING` to `PAID` without blocking the main thread.

---

## 5. Simplified Order Flow (Step-by-Step)

### Phase 1: Creating the Order (Synchronous)
1.  **UI** sends cart data to **API Gateway**.
2.  **API Gateway** validates the user and forwards to **Order Service**.
3.  **Order Service** saves a new order as `PENDING` and talks to **Stripe**.
4.  **Stripe** sends back a "secret key" for the payment.
5.  **Order Service** sends that key back to the **UI**.
6.  **User** sees the payment form.

### Phase 2: Processing Payment (External)
7.  **User** enters card details; **Stripe** processes the money.
8.  **Stripe** sends a "Success" message to the **Order Service** via a Webhook.

### Phase 3: Updating Status (Asynchronous via RabbitMQ)
9.  **Order Service** receives the success message and records the payment.
10. **Order Service** pushes a `PAYMENT_SUCCEEDED` message into **RabbitMQ**.
11. **RabbitMQ** holds the message and delivers it to the Order Consumer.
12. **Order Consumer** receives the message and updates the Order status to `PAID`.
13. **(Future)** Other services (Email, Shipping) also hear this message and start their work.

---
*Created as part of the learning journey for Modular Mart.*

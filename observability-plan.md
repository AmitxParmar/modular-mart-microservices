# Observability Plan for Microservices E-commerce Project

## Goal
Build logging, monitoring, and tracing in a way that is:
- small enough to run on free-tier or local Docker
- realistic enough for a resume
- easy to debug when one service fails
- easy to remove or scale later

## Strategy
Use a lean stack first:

- **Pino** for structured JSON logs
- **OpenTelemetry** for distributed tracing
- **Prometheus** for metrics scraping
- **Grafana** for dashboards
- **Jaeger** for trace visualization
- **RabbitMQ management UI** for queue inspection
- **Sentry** for error tracking

Do **not** start with ELK on a free tier. That becomes heavy fast and wastes time.

---

## Build order

### Phase 1: Standardize every service
- [x] Add a `serviceName` to every service.
- [x] Add a request ID middleware.
- [x] Make every request carry the same `requestId` across services.
- [x] Log only structured JSON.
- [x] Log errors with stack, service name, route, method, requestId, and latency.

### Phase 2: Make local runtime predictable
- [x] Put all core infra in Docker Compose.
- [x] Add health checks to app containers.
- [x] Add `depends_on` with health checks for startup order.
- [x] Keep observability services local in Docker during development.

### Phase 3: Add logging
- [x] Install Pino in every Node service.
- [x] Send logs to stdout.
- [x] Keep formatting minimal.
- [x] Attach `requestId` automatically in the logger context.
- [x] Log business events only when they matter: order placed, payment failed, stock reserved, retry triggered.
- [x] Add business-critical event logging.

### Phase 4: Add tracing
- [x] Install OpenTelemetry SDK in each service.
- [x] Auto-instrument HTTP and database calls where possible.
- [x] Add manual spans around checkout, payment, inventory reservation, and message queue handlers.
- [x] Export traces to Jaeger.
- [x] Make sure trace context passes through HTTP headers and queue message metadata.
- [x] Re-verify full-stack trace propagation after `catalog-service` database connectivity is restored.

### Phase 5: Add metrics
- [x] Expose a `/metrics` endpoint from each service.
- [x] Track request count, error count, latency, and queue depth.
- [x] Add service-specific metrics:
   - auth login failures
   - cart update rate
   - order creation failures
   - payment retry count
- [x] Scrape metrics with Prometheus.
- [x] Build Grafana dashboards on top of Prometheus.

### Phase 6: Add error tracking
- [x] Integrate Sentry SDK.
- [x] Capture unhandled exceptions and rejected promises.
- [x] Send production-like errors to Sentry.
- [x] Verify error capture.

### Phase 7: Add queue observability
- [x] Enable RabbitMQ management plugin.
- [ ] Watch queue size, consumers, unacked messages, and dead-letter queues. (Blocked: CloudAMQP free tier does not expose a Prometheus endpoint)
- [x] Add retries with backoff.
- [x] Add a dead-letter queue for poison messages.

---
## Final Validation
- [ ] Test failure scenarios and verify observability visibility.
---
## Current Status (End-to-End Verified)

- **Loki**: Running and ingesting logs. Verified via `curl http://localhost:3100/loki/api/v1/labels`.
- **Jaeger**: Running and receiving spans. Verified via `curl http://localhost:16686/api/services`.
- **Prometheus**: Running and scraping targets.
- **Grafana**: Provisioned with Loki, Prometheus, and Jaeger.
- **Promtail**: Running and discovering containers.

## How to see logs in Grafana
1. Open `http://localhost:3000`.
2. Login with `admin` / `admin`.
3. Go to **Explore** (compass icon on the left).
4. Select **Loki** from the dropdown at the top.
5. In the query box (Label browser), type: `{service="api-gateway"}`.
6. Click **Run Query**.
7. Ensure the time range is set to **Last 15 minutes**.

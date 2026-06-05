# 🔄 Kong Gateway Migration Plan

**Learning Project - Mid/Senior Engineer Level**  
**Platform**: Render.com  
**Focus**: Security, Observability, Resilience Patterns  
**Last Updated**: June 3, 2026

---

## 📋 Overview

Learning-focused migration from NestJS API Gateway to **Kong Gateway OSS**. Focus on production patterns without over-engineering.

**Timeline**: 4-6 weeks  
**Deployment**: Render.com (Docker)

### Learning Objectives

- Custom authentication plugins (Lua)
- Redis-backed distributed rate limiting (Shared External Instance)
- Response caching strategies
- Circuit breaker patterns
- Health-based load balancing
- Observability integration (LGTM stack)

---

## 🏗 Current Architecture

### What We Have

```
Client Request
    ↓
NestJS Gateway (:8000)
├─ Helmet (Security Headers)
├─ CORS
├─ X-Request-ID Generator
├─ Clerk JWT Verification
├─ In-Memory Rate Limiting (100/min)
├─ Pino Logging → Loki
└─ http-proxy-middleware
    ↓
Microservices
├─ User Service (:3001)
├─ Catalog Service (:3005)
├─ Order Service (:3002)
└─ Payment Service (:3004)
```

### Future Architecture (Target State)

```text
       Client
          ↓
    Kong Gateway (OSS)
    ├─ JWT Verification (Clerk)
    ├─ Rate Limiting (Shared External Redis)
    ├─ Proxy Caching (Catalog)
    ├─ Correlation IDs (X-Request-ID)
    ├─ Prometheus Metrics
    └─ Upstream Health Checks

          ↓ (Internal Network)

   ┌──────────────┬──────────────┬──────────────┐
   ↓              ↓              ↓              ↓
User Service   Catalog        Order          Payment
               Service        Service        Service

   └──────────────┴──────────────┴──────────────┘
          ↓              ↓              ↓
    Infrastructure (Shared Redis, RabbitMQ, PostgreSQL)
          ↓
    Observability (Prometheus, Grafana, Loki, Jaeger)
```

### Current Features & Gaps

| Feature | Current | Limitation | Kong Solution |
|---------|---------|------------|---------------|
| **Authentication** | Clerk JWT in Node.js | Coupled to app code | Custom Lua plugin |
| **Rate Limiting** | In-memory | Not distributed | Shared External Redis plugin |
| **Caching** | ❌ None | Repeated backend calls | Proxy cache plugin |
| **Circuit Breaking** | ❌ None | Cascading failures | Health checks + timeouts |
| **Load Balancing** | ❌ None | Single upstream | Round-robin / health-aware |
| **Config Changes** | Code + redeploy | Slow iteration | Declarative YAML |
| **Logging** | ✅ Pino | Good | Keep + enhance |
| **Tracing** | ✅ Jaeger | Good | Keep via OpenTelemetry |

### Why Kong?

**Technical Benefits**:
- Declarative configuration (no code changes for routes)
- Better performance (NGINX core)
- Rich plugin ecosystem
- Production-grade patterns built-in

**Learning Value**:
- Understand API gateway internals
- Custom plugin development
- Distributed system patterns
- Observability best practices

---

## 🎯 Core Features We Need

### 1. Authentication (Clerk JWT)

**Current Flow**:
```typescript
// packages/auth/clerk.guard.ts
const token = extractBearerToken(request);
const payload = await verifyToken(token, { secretKey });
const internalId = payload.publicMetadata?.internalId;
request.auth = { userId, internalId, email };
```

**Kong Approach**: Start with Built-in Plugins
- **Phase 1**: Use Kong's built-in JWT/OIDC plugins for token verification and route protection.
- **Phase 2 (Optional)**: Only build a custom Lua plugin to extract `publicMetadata.internalId` if the built-in plugins cannot be configured to map these claims to headers. Building a custom auth plugin before completing the baseline migration adds significant risk.

**Security Warning (Trust Boundary)**:
Kong will inject headers (e.g., `X-User-ID`) to downstream services. **Services must reject requests that bypass Kong.** You must ensure services are on an internal network only, remove direct public exposure, and document this trust boundary, otherwise attackers can spoof these headers.

### 2. Rate Limiting & Throttling (Shared Redis)

**Requirements**:
- 100 requests/minute per IP (global default)
- 50 requests/minute for order creation
- Distributed state via **Shared External Redis** (e.g., Upstash, Redis Cloud, or Render Managed Redis).
- **Strategy**: Use the same Redis instance and URL for both local development and production to maintain consistency and simplify management.

**Kong Plugin**: `rate-limiting` (OSS) with Redis policy

**Configuration**:
```yaml
plugins:
- name: rate-limiting
  config:
    policy: redis
    redis_host: ${REDIS_HOST}
    redis_port: ${REDIS_PORT}
    redis_password: ${REDIS_PASSWORD}
    redis_ssl: true # Required for most online services
    minute: 100
    fault_tolerant: true
```

### 3. Logging & Observability

**Keep Existing**:
- Loki for log aggregation
- Jaeger for distributed tracing
- Prometheus for metrics
- Grafana for visualization

**Kong Integration**:
- `http-log` plugin → forward to Loki
- `opentelemetry` plugin → export to Jaeger
- `prometheus` plugin → expose metrics at `:8001/metrics`
- `correlation-id` plugin → propagate `X-Request-ID`

**Important**: Services *must* log this `X-Request-ID`, propagate it in all outbound API calls, and attach it to messaging events (e.g., RabbitMQ). Otherwise, tracing breaks at service boundaries.

**Plugin Verification Warning**: Before designing around these plugins (like `opentelemetry` and Redis-backed `rate-limiting`), verify their availability and exact feature sets in the **Kong OSS 3.x** version you are deploying. Some tutorials mix Enterprise and OSS features.

### 4. Health-Based Failover & Upstream Protection

*Note: This is failover and health-based routing, not a true circuit breaker (which opens, rejects requests, tracks failures, and retries according to state transitions).*

**Pattern**: Prevent cascading failures when downstream services are unhealthy by removing them from the load balancer pool.

**Kong Approach**:
- Health checks on upstreams (active probing)
- Automatic removal of unhealthy targets
- Timeouts: sensible `connect_timeout`, `read_timeout`, `write_timeout`

**Configuration**:
```yaml
upstreams:
- name: order-service-upstream
  healthchecks:
    active:
      http_path: /health/ready
      healthy:
        interval: 10
        successes: 2
      unhealthy:
        interval: 5
        http_failures: 3
        timeouts: 2
```

### 5. Response Caching

**Use Case**: Cache catalog/product listing responses to reduce backend load

**Kong Plugin**: `proxy-cache` (OSS)

**Strategy**:
- Cache GET requests only
- Vary by query parameters
- TTL: 300s (5 minutes) for product lists
- Cache-Control header awareness

**Limitation**: The `memory` strategy stores cache in the local Kong instance's RAM. If you scale Kong to multiple instances (Kong A and Kong B), they will not share the cache. For this learning project, we use `memory` strategy to keep it simple, but note that production scaling would use the shared Redis instance.

**Configuration**:
```yaml
plugins:
- name: proxy-cache
  config:
    strategy: memory
    content_type: ["application/json"]
    cache_ttl: 300
    cache_control: true
    request_method: ["GET"]
    response_code: [200]
```

### 6. Security

**Requirements**:
- Security headers (CSP, HSTS, X-Frame-Options)
- CORS with origin whitelist
- Request size limiting (10MB max)
- IP-based restrictions for admin routes

**Kong Plugins**:
- `response-transformer` → inject security headers
- `cors` → handle preflight and origin validation
- `request-size-limiting` → prevent large payload attacks
- `ip-restriction` → whitelist/blacklist IPs

### 7. Monitoring & Metrics

**Metrics to Track**:
- Request latency (p50, p95, p99)
- Throughput (requests/second)
- Error rates (4xx, 5xx)
- Cache hit ratio
- Rate limit rejections
- Upstream health status

**Implementation**: Prometheus plugin + Grafana dashboards



---

## 📅 Migration Phases

### Phase 1: Setup Kong & External Redis (Week 1)

**Goal**: Get Kong running locally using the shared online Redis service.

**Tasks**:
1. Provision an online Redis instance (e.g., Upstash, Render Redis).
2. Create `docker-compose.kong.yml` (Note: No local Redis service):
   ```yaml
   services:
     kong:
       image: kong:3.4-alpine
       environment:
         KONG_DATABASE: "off"
         KONG_DECLARATIVE_CONFIG: /etc/kong/kong.yml
         KONG_PROXY_LISTEN: 0.0.0.0:8000
         KONG_ADMIN_LISTEN: 127.0.0.1:8001 # CRITICAL: NEVER expose Admin API publicly
         # Use External Redis Env Vars
         REDIS_HOST: ${REDIS_HOST}
         REDIS_PORT: ${REDIS_PORT}
         REDIS_PASSWORD: ${REDIS_PASSWORD}
       volumes:
         - ./kong/kong.yml:/etc/kong/kong.yml
       ports:
         - "8000:8000"
         - "8001:8001"
   ```

2. Create basic `kong/kong.yml` using `${REDIS_HOST}` environment variable substitution.
3. Test routing: `curl http://localhost:8000/api/catalog/products`
4. Verify admin API: `curl http://localhost:8001/services` (from host)
5. **Validation**: Verify internal service-to-service communication on Render before migration.

**Learning**: Kong declarative config, Environment variable injection, External service management.

---

### Phase 2: Core Migration & Built-in Auth (Week 2)

**Goal**: Migrate routes and use built-in Kong JWT protection.

**Tasks**:
1. Configure `jwt` plugin for routes requiring auth.
2. Test header injection (X-User-ID) using built-in claims.
3. Establish service trust boundary (internal network).
4. **Optional**: Only if built-in extraction fails for `publicMetadata`, begin planning custom Lua plugin.

**Learning**: Kong built-in auth, network security.

---

### Phase 3: Rate Limiting + Caching (Week 3)

**Goal**: Add distributed rate limiting using the **shared external Redis**.

**Tasks**:
1. Configure `rate-limiting` plugin with the shared Redis URL.
2. Test rate limiting: send 101 requests from local machine, verify 429.
3. Configure `proxy-cache` plugin for catalog endpoints.
4. Measure cache hit ratio.
5. Test cache invalidation.

**Learning**: Distributed state management, Shared resource strategies.

---

### Phase 4: Upstream Protection + Observability (Week 4)

**Goal**: Add health checks and integrate with LGTM stack.

**Tasks**:
1. Configure active health checks on all upstreams.
2. Test failure scenario: stop a service, watch Kong remove it.
3. Configure `opentelemetry` plugin → Jaeger.
4. Configure `http-log` plugin → Loki.
5. Configure `prometheus` plugin.
6. Create Grafana dashboard.

**Learning**: Health-based routing, observability integration.

---

### Phase 4.5: Contract Testing & Rollback Strategy

**Goal**: Ensure we can verify the migration and safely revert if needed.

**Tasks**:
1. **Contract Testing**: Before removing the Nest gateway, capture current API behavior.
2. **Rollback Strategy**: Define the DNS or Render routing switch.

---

### Phase 5: Security + Full Migration (Week 5-6)

**Goal**: Add security features and migrate all services.

**Tasks**:
1. Add security headers via `response-transformer`.
2. Configure CORS properly.
3. Add request size limiting.
4. Run Contract Tests against Kong to verify parity.
5. Deploy Kong to Render.

**Learning**: Security best practices, production deployment.

---

### Phase 6: Post-Migration Learning (Custom Plugin Focus)

**Goal**: Deepen understanding of Kong internals by building the custom Clerk auth plugin.

**Tasks**:
1. Build custom Clerk auth plugin (Lua) to extract nested `publicMetadata`.
2. Implement custom header injection for downstream services.
3. Compare performance and maintainability against Phase 2's built-in JWT approach.
4. Benchmark impact of custom Lua logic on request latency.

**Learning**: Lua plugin development, Kong PDK, advanced performance tuning.

---

## 🔧 Complete Kong Configuration

### Full `kong.yml` (Declarative Config)

```yaml
_format_version: "3.0"

# ─────────────────────────────────────
# Upstreams (with health checks)
# ─────────────────────────────────────
upstreams:
- name: user-service-upstream
  algorithm: round-robin
  targets:
  - target: user-service:3001
  healthchecks:
    active:
      http_path: /health/ready
      healthy:
        interval: 10
        successes: 2
      unhealthy:
        interval: 5
        http_failures: 3

- name: catalog-service-upstream
  algorithm: round-robin
  targets:
  - target: catalog-service:3005
  healthchecks:
    active:
      http_path: /health/ready
      healthy:
        interval: 10
        successes: 2

- name: order-service-upstream
  algorithm: round-robin
  targets:
  - target: order-service:3002
  healthchecks:
    active:
      http_path: /health/ready

- name: payment-service-upstream
  algorithm: round-robin
  targets:
  - target: payment-service:3004
  healthchecks:
    active:
      http_path: /health/ready

# ─────────────────────────────────────
# Services & Routes
# ─────────────────────────────────────
services:
- name: user-service
  host: user-service-upstream
  port: 3001
  protocol: http
  connect_timeout: 5000
  read_timeout: 15000
  write_timeout: 15000
  routes:
  - name: user-routes
    paths:
    - /api/users
    strip_path: false
  plugins:
  - name: rate-limiting
    config:
      policy: redis
      redis_host: ${REDIS_HOST}
      redis_port: ${REDIS_PORT}
      redis_password: ${REDIS_PASSWORD}
      redis_ssl: true
      minute: 100

- name: catalog-service
  host: catalog-service-upstream
  port: 3005
  routes:
  - name: catalog-routes
    paths:
    - /api/catalog
    - /api/products
    - /api/cart
    strip_path: false
  plugins:
  - name: rate-limiting
    config:
      policy: redis
      redis_host: ${REDIS_HOST}
      redis_port: ${REDIS_PORT}
      redis_password: ${REDIS_PASSWORD}
      redis_ssl: true
      minute: 100
  - name: proxy-cache
    config:
      strategy: memory
      content_type: ["application/json"]
      cache_ttl: 300
      request_method: ["GET"]

- name: order-service
  host: order-service-upstream
  port: 3002
  routes:
  - name: order-routes
    paths:
    - /api/orders
    strip_path: false
  plugins:
  - name: rate-limiting
    config:
      policy: redis
      redis_host: ${REDIS_HOST}
      redis_port: ${REDIS_PORT}
      redis_password: ${REDIS_PASSWORD}
      redis_ssl: true
      minute: 50  # Stricter for orders

- name: payment-service
  host: payment-service-upstream
  port: 3004
  routes:
  - name: payment-routes
    paths:
    - /api/payments
    strip_path: false
  plugins:
  - name: rate-limiting
    config:
      policy: redis
      redis_host: ${REDIS_HOST}
      redis_port: ${REDIS_PORT}
      redis_password: ${REDIS_PASSWORD}
      redis_ssl: true
      minute: 30  # Strictest for payments

# ─────────────────────────────────────
# Global Plugins
# ─────────────────────────────────────
plugins:
- name: correlation-id
  config:
    header_name: x-request-id
    generator: uuid
    echo_downstream: true

- name: prometheus
  config:
    per_consumer: false
    status_code_metrics: true
    latency_metrics: true

- name: response-transformer
  config:
    add:
      headers:
      - "X-Frame-Options: DENY"
      - "X-Content-Type-Options: nosniff"
      - "Strict-Transport-Security: max-age=31536000"

- name: cors
  config:
    origins:
    - http://localhost:3000
    - http://localhost:4000
    credentials: true
    exposed_headers:
    - x-request-id

- name: request-size-limiting
  config:
    allowed_payload_size: 10
    size_unit: megabytes

- name: opentelemetry
  config:
    endpoint: http://jaeger:4318/v1/traces
    resource_attributes:
      service.name: kong-gateway

- name: http-log
  config:
    http_endpoint: http://loki:3100/loki/api/v1/push
    method: POST
    content_type: application/json
```



---

## 🚀 Render Deployment

### Docker Setup for Render

**Dockerfile** (`apps/api-gateway/Dockerfile.kong`):
```dockerfile
FROM kong:3.4-alpine

# Copy declarative config
COPY kong/kong.yml /etc/kong/kong.yml

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml

USER kong
EXPOSE 8000 8001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["kong", "docker-start"]
```

### Render Blueprint (`render.yaml`)

```yaml
services:
  # Kong Gateway
  - type: web
    name: kong-gateway
    runtime: docker
    dockerfilePath: ./apps/api-gateway/Dockerfile.kong
    envVars:
      - key: KONG_PROXY_LISTEN
        value: 0.0.0.0:8000
      - key: KONG_ADMIN_LISTEN
        value: 127.0.0.1:8001 # CRITICAL: NEVER expose Admin API publicly
      - key: REDIS_HOST
        sync: false # Add from online service
      - key: REDIS_PORT
        sync: false
      - key: REDIS_PASSWORD
        sync: false
    healthCheckPath: /health/live

  # Existing microservices
  - type: web
    name: user-service
    runtime: docker
    dockerfilePath: ./apps/user-service/Dockerfile
    
  - type: web
    name: catalog-service
    runtime: docker
    dockerfilePath: ./apps/catalog-service/Dockerfile

  # ... other services
```

### Environment Variables

**Required for Kong (derived from shared REDIS_URL)**:
```bash
KONG_DATABASE=off
KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
KONG_PROXY_LISTEN=0.0.0.0:8000
KONG_ADMIN_LISTEN=127.0.0.1:8001 # CRITICAL: Admin API must not be public

# Shared External Redis (Same for Local & Prod)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

---

## 🎓 Key Learning Concepts

### 1. External Resource Management
- Managing shared state across environments.
- Security implications of online Redis services (SSL, Authentication).
- Tradeoffs of single-instance vs. multi-instance Redis.

### 2. Distributed Systems
- Distributed rate limiting consistency.
- Shared infrastructure in microservices.

---

## 📋 Task List

### Week 1: Setup Shared Redis & Local Kong
- [x] Provision a single shared online Redis instance.
- [x] Configure `.env` with `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`.
- [x] Create basic `kong/kong.yml` with environment variable substitution.
- [x] Test local Kong routing using the online Redis instance.
- [x] Verify Admin API is restricted.
- [x] Validate Render internal networking.

**Reusable Code Added:**
- Created `@repo/shared-types` package (`packages/shared-types`) to centralize `AuthContext`, `RequestContext`, `HealthResponse`, `EventMetadata`, and `LogContext` types.
- Scaffolded `apps/kong-gateway` with `kong.yml`, `Dockerfile`, and `docker-compose.yml`.

### Week 2: Core Migration & Built-in Auth
- [ ] Set up basic Kong routes for all microservices.
- [ ] Configure `jwt` plugin.
- [ ] Establish service trust boundary.

### Week 3: Rate Limiting & Caching
- [ ] Enable `rate-limiting` plugin with shared Redis.
- [ ] Verify 429 responses and state persistence across environments.
- [ ] Enable `proxy-cache` (memory strategy).

### Week 4-6: Full Migration & Learning
- [ ] Complete Observability, Security, and Rollback phases.
- [ ] Deploy to Render.
- [ ] **Phase 6**: Start building custom Lua plugin to extract nested JWT claims.

---

## 🤔 Discussion Points

### Shared Redis for All Services?
- **Tradeoff**: Simplifies management and reduces cost for a learning project.
- **Risk**: Single point of failure (SPOF) and potential "noisy neighbor" issues if one service floods Redis.
- **Production Pattern**: In a large-scale system, critical services might get their own Redis clusters or use logical database separation (though DB indices are deprecated in some Redis versions/configurations).

### Same Redis URL for Local & Prod?
- **Benefits**: Perfect parity in behavior and configuration.
- **Risk**: Accidentally flushing production data from a local environment. **Mitigation**: Use different Redis databases or keyspace prefixes if supported, or maintain separate instances for true production isolation in non-learning projects.

---

**Next Steps**: Start with Week 1 tasks. Provision your online Redis instance first.

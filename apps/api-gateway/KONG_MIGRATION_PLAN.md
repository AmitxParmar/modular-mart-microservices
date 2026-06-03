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
- Redis-backed distributed rate limiting
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

### Current Features & Gaps

| Feature | Current | Limitation | Kong Solution |
|---------|---------|------------|---------------|
| **Authentication** | Clerk JWT in Node.js | Coupled to app code | Custom Lua plugin |
| **Rate Limiting** | In-memory | Not distributed | Redis-backed plugin |
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

**Kong Approach**: Custom Lua plugin
- Verify JWT signature using Clerk JWKS
- Extract `publicMetadata.internalId`
- Inject headers: `X-User-ID`, `X-User-Internal-ID`, `X-User-Email`
- Handle missing metadata gracefully

**Why Custom Plugin?**: Kong's built-in JWT plugin can't extract nested `publicMetadata`.

### 2. Rate Limiting & Throttling

**Requirements**:
- 100 requests/minute per IP (global default)
- 50 requests/minute for order creation
- 30 requests/minute for payment processing
- Distributed state (Redis)
- Return `429 Too Many Requests` with retry-after header

**Kong Plugin**: `rate-limiting` (OSS) with Redis policy

**Configuration**:
```yaml
plugins:
- name: rate-limiting
  config:
    policy: redis
    redis_host: redis
    redis_port: 6379
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

### 4. Circuit Breaker

**Pattern**: Prevent cascading failures when downstream services are unhealthy

**Kong Approach**:
- Health checks on upstreams (active probing)
- Automatic removal of unhealthy targets
- Timeouts: `connect_timeout`, `read_timeout`, `write_timeout`

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

### Phase 1: Setup Kong Locally (Week 1)

**Goal**: Get Kong running with basic routing

**Tasks**:
1. Create `docker-compose.kong.yml`:
   ```yaml
   services:
     kong:
       image: kong:3.4-alpine
       environment:
         KONG_DATABASE: "off"
         KONG_DECLARATIVE_CONFIG: /etc/kong/kong.yml
         KONG_PROXY_LISTEN: 0.0.0.0:8000
         KONG_ADMIN_LISTEN: 0.0.0.0:8001
       volumes:
         - ./kong/kong.yml:/etc/kong/kong.yml
       ports:
         - "8000:8000"
         - "8001:8001"
     
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
   ```

2. Create basic `kong/kong.yml` with one service (Catalog)
3. Test routing: `curl http://localhost:8000/api/catalog/products`
4. Verify admin API: `curl http://localhost:8001/services`

**Learning**: Kong declarative config, DB-less mode

---

### Phase 2: Authentication Plugin (Week 2)

**Goal**: Build custom Clerk authentication plugin

**Tasks**:
1. Create plugin structure:
   ```
   kong/plugins/clerk-auth/
   ├── handler.lua
   ├── schema.lua
   └── access.lua
   ```

2. Implement JWT verification with Clerk JWKS
3. Extract `publicMetadata.internalId`
4. Inject headers for downstream services
5. Test with real Clerk tokens

**Plugin Code** (simplified):
```lua
-- kong/plugins/clerk-auth/handler.lua
local jwt = require "resty.jwt"
local http = require "resty.http"

local ClerkAuthHandler = {
  PRIORITY = 1000,
  VERSION = "1.0.0",
}

function ClerkAuthHandler:access(conf)
  local auth_header = kong.request.get_header("Authorization")
  if not auth_header then
    return kong.response.exit(401, {message = "Missing auth"})
  end

  local token = auth_header:match("Bearer%s+(.+)")
  if not token then
    return kong.response.exit(401, {message = "Invalid format"})
  end

  -- Verify JWT (use Clerk's JWKS endpoint)
  local jwt_obj = jwt:verify(conf.clerk_secret_key, token)
  
  if not jwt_obj.verified then
    return kong.response.exit(401, {message = "Invalid token"})
  end

  -- Extract metadata
  local claims = jwt_obj.payload
  local internal_id = claims.publicMetadata and claims.publicMetadata.internalId or ""

  -- Inject headers
  kong.service.request.set_header("X-User-ID", claims.sub)
  kong.service.request.set_header("X-User-Internal-ID", internal_id)
  kong.service.request.set_header("X-User-Email", claims.email or "")
end

return ClerkAuthHandler
```

**Learning**: Kong plugin architecture, Lua basics, JWT verification

---

### Phase 3: Rate Limiting + Caching (Week 3)

**Goal**: Add distributed rate limiting and response caching

**Tasks**:
1. Configure `rate-limiting` plugin with Redis
2. Test rate limiting: send 101 requests, verify 429
3. Configure `proxy-cache` plugin for catalog endpoints
4. Measure cache hit ratio
5. Test cache invalidation

**Kong Config**:
```yaml
services:
- name: catalog-service
  url: http://catalog-service:3005
  routes:
  - name: catalog-routes
    paths:
    - /api/catalog
    - /api/products
  plugins:
  - name: rate-limiting
    config:
      policy: redis
      redis_host: redis
      minute: 100
      fault_tolerant: true
  
  - name: proxy-cache
    config:
      strategy: memory
      content_type: ["application/json"]
      cache_ttl: 300
      request_method: ["GET"]
      response_code: [200, 404]
```

**Learning**: Distributed rate limiting, HTTP caching strategies

---

### Phase 4: Circuit Breaking + Observability (Week 4)

**Goal**: Add health checks and integrate with LGTM stack

**Tasks**:
1. Configure active health checks on all upstreams
2. Test failure scenario: stop a service, watch Kong remove it
3. Configure `opentelemetry` plugin → Jaeger
4. Configure `http-log` plugin → Loki
5. Configure `prometheus` plugin
6. Create Grafana dashboard

**Health Check Config**:
```yaml
upstreams:
- name: user-service-upstream
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
        timeouts: 2
```

**Learning**: Circuit breaker patterns, health-based routing, observability integration

---

### Phase 5: Security + Full Migration (Week 5-6)

**Goal**: Add security features and migrate all services

**Tasks**:
1. Add security headers via `response-transformer`
2. Configure CORS properly
3. Add request size limiting
4. Migrate remaining services (User, Order, Payment)
5. Test entire flow end-to-end
6. Deploy to Render

**Security Config**:
```yaml
plugins:
- name: response-transformer
  config:
    add:
      headers:
      - "X-Frame-Options: DENY"
      - "X-Content-Type-Options: nosniff"
      - "Strict-Transport-Security: max-age=31536000"

- name: cors
  config:
    origins: ["http://localhost:3000"]
    credentials: true
    exposed_headers: ["x-request-id"]

- name: request-size-limiting
  config:
    allowed_payload_size: 10
    size_unit: megabytes
```

**Learning**: Security best practices, production deployment

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
  connect_timeout: 45000
  read_timeout: 45000
  write_timeout: 45000
  routes:
  - name: user-routes
    paths:
    - /api/users
    strip_path: false
  plugins:
  - name: clerk-auth  # Custom plugin
  - name: rate-limiting
    config:
      policy: redis
      redis_host: redis
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
      redis_host: redis
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
  - name: clerk-auth
  - name: rate-limiting
    config:
      policy: redis
      redis_host: redis
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
  - name: clerk-auth
  - name: rate-limiting
    config:
      policy: redis
      redis_host: redis
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

# Copy custom plugins
COPY kong/plugins/clerk-auth /usr/local/share/lua/5.1/kong/plugins/clerk-auth

# Copy declarative config
COPY kong/kong.yml /etc/kong/kong.yml

# Enable custom plugin
ENV KONG_PLUGINS=bundled,clerk-auth
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
        value: 0.0.0.0:8001
      - key: CLERK_SECRET_KEY
        sync: false  # Add manually in dashboard
    healthCheckPath: /health/live

  # Redis for rate limiting
  - type: redis
    name: kong-redis
    plan: starter
    ipAllowList: []

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

**Required for Kong**:
```bash
KONG_DATABASE=off
KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
KONG_PROXY_LISTEN=0.0.0.0:8000
KONG_ADMIN_LISTEN=0.0.0.0:8001
KONG_PLUGINS=bundled,clerk-auth

# Custom plugin config
CLERK_SECRET_KEY=sk_live_xxxxx

# Redis connection
REDIS_HOST=kong-redis.internal
REDIS_PORT=6379

# Observability
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces
LOKI_ENDPOINT=http://loki:3100/loki/api/v1/push
```

### Deployment Steps

1. **Build locally**:
   ```bash
   docker build -f apps/api-gateway/Dockerfile.kong -t kong-gateway .
   docker run -p 8000:8000 -p 8001:8001 kong-gateway
   ```

2. **Test locally**:
   ```bash
   # Health check
   curl http://localhost:8001/status
   
   # Test routing
   curl http://localhost:8000/api/catalog/products
   ```

3. **Deploy to Render**:
   ```bash
   # Via Render dashboard or CLI
   render-cli deploy --blueprint render.yaml
   ```

4. **Verify deployment**:
   ```bash
   curl https://kong-gateway.onrender.com/health/live
   ```

---

## 💡 Suggested Improvements

### Short-Term (Next 2-4 weeks)

1. **Request/Response Transformation**
   - Use `request-transformer` to standardize API contracts
   - Transform legacy endpoints to new formats
   - Add versioning headers automatically

2. **Advanced Caching**
   - Implement cache warming strategies
   - Add surrogate keys for fine-grained invalidation
   - Use Redis for distributed cache (Kong Enterprise feature, but can implement custom)

3. **Better Error Handling**
   - Custom error templates
   - Structured error responses with correlation IDs
   - Error rate alerting via Prometheus

4. **API Documentation**
   - Auto-generate OpenAPI spec from Kong routes
   - Deploy Swagger UI endpoint
   - Kong Developer Portal (Enterprise) or custom solution

5. **GraphQL Support**
   - Add `graphql-proxy-cache-advanced` plugin
   - Query complexity limiting
   - Persisted queries

### Mid-Term (1-3 months)

6. **API Versioning Strategy**
   - Path-based: `/v1/api/users`, `/v2/api/users`
   - Header-based: `Accept: application/vnd.api.v2+json`
   - Gradual deprecation of old versions

7. **Service Mesh Integration**
   - Evaluate Kong for Kubernetes (KIC)
   - mTLS between services
   - Service-to-service authentication

8. **Advanced Rate Limiting**
   - Per-user rate limits (not just per-IP)
   - Tiered rate limits (free/pro/enterprise users)
   - Quota management

9. **Webhooks Gateway**
   - Dedicated Kong instance for outbound webhooks
   - Retry logic with exponential backoff
   - Webhook signature verification

10. **Multi-Region Setup**
    - Deploy Kong in multiple regions
    - Geo-routing for low latency
    - Cross-region rate limit synchronization

### Long-Term (3-6 months)

11. **API Analytics**
    - Custom analytics plugin
    - Track API usage patterns
    - Business metrics (revenue per endpoint)

12. **Advanced Security**
    - Bot detection plugin
    - CAPTCHA integration for suspicious traffic
    - DDoS protection with Cloudflare integration

13. **Policy-as-Code**
    - OPA (Open Policy Agent) plugin
    - Centralized authorization rules
    - Dynamic policy updates

14. **Blue-Green for Services**
    - Use Kong for traffic splitting
    - Canary deployments per service
    - A/B testing capabilities

15. **Kong Enterprise Features**
    - Evaluate if worth upgrading
    - Dev Portal for API consumers
    - RBAC for Kong Admin API
    - Advanced analytics

---

## 🎓 Key Learning Concepts

### 1. Plugin Development
- Lua basics and OpenResty
- Kong plugin lifecycle (init, access, header_filter, etc.)
- Testing Kong plugins with `pongo`

### 2. Distributed Systems
- CAP theorem in rate limiting (consistency vs availability)
- Circuit breaker patterns
- Health check strategies

### 3. API Gateway Patterns
- Backend for Frontend (BFF)
- API composition
- Request/response transformation

### 4. Security
- JWT verification flows
- CORS deep dive
- Security headers (CSP, HSTS, etc.)
- Defense in depth

### 5. Observability
- Distributed tracing (Jaeger/OTLP)
- Structured logging (Loki)
- Metrics collection (Prometheus)
- Dashboard design (Grafana)

### 6. Performance
- HTTP caching strategies (ETags, Cache-Control)
- Connection pooling
- Load balancing algorithms
- NGINX tuning

---

## 📋 Task List

### Week 1: Local Setup
- [ ] Install Kong locally via Docker
- [ ] Create `docker-compose.kong.yml`
- [ ] Create basic `kong/kong.yml` with catalog service
- [ ] Test basic routing (`/api/catalog/*` → catalog-service)
- [ ] Verify Kong Admin API working
- [ ] Read Kong documentation (declarative config)

### Week 2: Authentication Plugin
- [ ] Set up plugin development environment
- [ ] Create `kong/plugins/clerk-auth/` structure
- [ ] Implement `handler.lua` with JWT verification
- [ ] Implement `schema.lua` for config validation
- [ ] Test plugin with real Clerk tokens
- [ ] Handle missing `internalId` gracefully
- [ ] Write unit tests for plugin (optional)
- [ ] Document plugin configuration

### Week 3: Rate Limiting & Caching
- [ ] Deploy Redis locally
- [ ] Configure `rate-limiting` plugin with Redis policy
- [ ] Test rate limiting (send 101 requests, verify 429)
- [ ] Verify rate limit state persists across Kong restarts
- [ ] Configure `proxy-cache` plugin for catalog
- [ ] Test cache: verify cache headers, hit/miss ratio
- [ ] Measure performance improvement
- [ ] Document caching strategy

### Week 4: Circuit Breaking & Observability
- [ ] Configure active health checks on all upstreams
- [ ] Test health check: stop catalog service, verify removal
- [ ] Configure `opentelemetry` plugin → Jaeger
- [ ] Verify traces show complete request flow
- [ ] Configure `http-log` plugin → Loki
- [ ] Configure `prometheus` plugin
- [ ] Create Grafana dashboard for Kong metrics
- [ ] Set up alerts (error rate, latency)

### Week 5: Security & Full Migration
- [ ] Add security headers via `response-transformer`
- [ ] Configure CORS with proper origins
- [ ] Add `request-size-limiting` plugin
- [ ] Test CORS preflight requests
- [ ] Migrate user-service routes to Kong
- [ ] Migrate order-service routes to Kong
- [ ] Migrate payment-service routes to Kong
- [ ] End-to-end integration tests
- [ ] Load testing (k6 or similar)

### Week 6: Production Deployment
- [ ] Create `Dockerfile.kong` with custom plugin
- [ ] Create `render.yaml` blueprint
- [ ] Test Docker build locally
- [ ] Deploy Kong to Render (staging)
- [ ] Configure environment variables in Render
- [ ] Update frontend to point to Kong URL
- [ ] Test in staging thoroughly
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Document operational procedures

### Post-Deployment
- [ ] Create Kong operational runbook
- [ ] Document plugin maintenance procedures
- [ ] Set up monitoring alerts
- [ ] Plan next improvements (see suggestions above)
- [ ] Write blog post about learnings (optional)

---

## 📚 Resources

### Kong Official
- [Kong Gateway Docs](https://docs.konghq.com/gateway/latest/)
- [Plugin Development Guide](https://docs.konghq.com/gateway/latest/plugin-development/)
- [Declarative Config](https://docs.konghq.com/deck/latest/)

### Clerk Integration
- [Clerk JWT Structure](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Verifying Clerk Tokens](https://clerk.com/docs/backend-requests/handling/manual-jwt)

### Lua & OpenResty
- [Lua Quick Start](https://www.lua.org/start.html)
- [OpenResty Best Practices](https://openresty.org/en/getting-started.html)
- [lua-resty-jwt](https://github.com/SkyLothar/lua-resty-jwt)

### Patterns & Best Practices
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Rate Limiting Algorithms](https://www.quinbay.com/blog/rate-limiting-algorithms)

---

## 🤔 Discussion Points

### Why Not Stick with NestJS?
- **Learning**: Kong exposes you to different paradigm (config-driven)
- **Performance**: NGINX core vs Node.js event loop
- **Industry Standard**: Kong/NGINX used widely in production
- **Separation of Concerns**: Gateway logic decoupled from application code

### Kong OSS vs Enterprise?
- **OSS**: Free, sufficient for learning and small projects
- **Enterprise**: Dev Portal, RBAC, advanced analytics ($$$)
- **Recommendation**: Start with OSS, evaluate Enterprise later

### Why Lua for Plugins?
- **Integration**: Native to OpenResty/NGINX
- **Performance**: Compiled to LuaJIT bytecode
- **Simplicity**: Easier than C modules
- **Alternative**: Kong 3.0+ supports Go plugins (experimental)

### Redis Single Point of Failure?
- **For Learning**: Single Redis instance is fine
- **Production**: Redis Sentinel or Cluster
- **Fallback**: `fault_tolerant: true` allows requests when Redis is down

---

**Next Steps**: Start with Week 1 tasks. Focus on understanding each concept before moving forward. Don't rush—this is about learning production patterns, not just completing a migration.

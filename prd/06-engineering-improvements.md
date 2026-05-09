# Modular Mart - Learning & Improvement Opportunities

## Database Learning Opportunities

### 1. Query Optimization Practice

**Current State**: Basic indexes on foreign keys
**Learning Opportunities**:

#### Practice Creating Composite Indexes

```sql
-- Learning exercise: Create indexes for common query patterns
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_status ON orders(created_at, status);
CREATE INDEX idx_products_category_price ON products(category_id, price);
```

#### Learn Query Performance Analysis

- **Tool**: EXPLAIN ANALYZE for query plans
- **Exercise**: Identify and optimize slow queries
- **Learning Goal**: Understand how indexes affect performance
- **Practice**: Write queries with different WHERE clauses and observe performance

#### Learn Connection Management

- **Current**: Basic connection handling
- **Learning**: Implement connection pooling in TypeORM
- **Benefit**: Understand connection lifecycle and resource management
- **Exercise**: Test with multiple concurrent requests

### 2. Database Schema Enhancements

**Current State**: Basic schema with minimal constraints

#### Add Missing Constraints

```sql
-- Add check constraints
ALTER TABLE products ADD CONSTRAINT chk_price_positive CHECK (price > 0);
ALTER TABLE orders ADD CONSTRAINT chk_total_positive CHECK (total_amount >= 0);
ALTER TABLE order_items ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0);

-- Add not null constraints
ALTER TABLE products ALTER COLUMN name SET NOT NULL;
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
```

#### Add Audit Columns

```sql
-- Add to all tables
ALTER TABLE users ADD COLUMN created_by UUID;
ALTER TABLE users ADD COLUMN updated_by UUID;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1;

-- Add triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Partitioning Strategy

**Current State**: Single table for all historical data
**Improvement**: Time-based partitioning

```sql
-- Partition orders table by month
CREATE TABLE orders_2026_05 PARTITION OF orders
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE orders_2026_06 PARTITION OF orders
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
BEGIN
    -- Logic to create next month's partition
    -- Run via cron job monthly
END;
$$ language 'plpgsql';
```

### 4. Read Replicas Setup

**Current State**: Single database instance
**Improvement**: Master-replica architecture

```yaml
# docker-compose.yml addition
services:
  postgres-primary:
    image: postgres:15
    environment:
      POSTGRES_REPLICATION_MODE: master
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}

  postgres-replica:
    image: postgres:15
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_REPLICATION_SSLMODE: prefer
    depends_on:
      - postgres-primary
```

## Performance Improvements

### 1. Caching Strategy

**Current State**: Minimal caching
**Improvement**: Multi-layer caching

#### Redis Cache Layers

```typescript
// Service-level interface
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

// Cache keys pattern
const CACHE_KEYS = {
  PRODUCT: (id: string) => `product:${id}`,
  CATEGORY: (slug: string) => `category:${slug}`,
  USER_CART: (userId: string) => `cart:user:${userId}`,
  GUEST_CART: (sessionId: string) => `cart:guest:${sessionId}`,
};
```

#### Cache Invalidation Strategy

- **Product updates**: Invalidate product cache and related category caches
- **Order creation**: Invalidate user cart cache
- **Category updates**: Invalidate all product caches in category
- **TTL Strategy**: Short TTL for volatile data, longer for static data

### 2. API Response Optimization

**Current State**: Full object responses
**Improvement**: Selective field loading, pagination optimization

```typescript
// GraphQL-like field selection
interface FieldSelection {
  fields?: string[];
  relations?: Record<string, FieldSelection>;
}

// Usage in controllers
@Get('/products')
async getProducts(
  @Query() query: ProductQuery,
  @Query('fields') fields?: string[]
) {
  return this.productService.findAll(query, fields);
}
```

#### Response Compression

- **Enable**: Gzip/Brotli compression
- **Threshold**: Compress responses > 1KB
- **CDN**: Cache compressed responses at edge

### 3. Background Job Processing

**Current State**: Synchronous processing
**Improvement**: Offload to background workers

```typescript
// Job types
enum JobType {
  SEND_EMAIL = "send_email",
  GENERATE_REPORT = "generate_report",
  PROCESS_IMAGE = "process_image",
  SYNC_EXTERNAL = "sync_external",
}

// Job queue implementation
interface JobQueue {
  add(job: Job): Promise<string>;
  process(worker: (job: Job) => Promise<void>): void;
  onCompleted(callback: (job: Job) => void): void;
  onFailed(callback: (job: Job, error: Error) => void): void;
}
```

## Code Quality Improvements

### 1. Type Safety Enhancements

**Current State**: Basic TypeScript usage
**Improvement**: Strict mode, branded types

```typescript
// Branded types for domain concepts
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };
type ProductId = string & { readonly __brand: "ProductId" };

// Type guards
function isUserId(id: string): id is UserId {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
    id,
  );
}

// Usage
function getUser(id: UserId): Promise<User> {
  // Compile-time type safety
}
```

### 2. Error Handling Standardization

**Current State**: Inconsistent error handling
**Improvement**: Unified error classes and middleware

```typescript
// Domain-specific errors
class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends DomainError {
  constructor(message: string, details?: any) {
    super("VALIDATION_ERROR", message, details, 400);
  }
}

class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(
      "NOT_FOUND",
      `${resource} with id ${id} not found`,
      { resource, id },
      404,
    );
  }
}

// Global error handler
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Standardized error response
  }
}
```

### 3. Testing Improvements

**Current State**: Basic unit tests
**Improvement**: Comprehensive test suite

#### Test Pyramid Strategy

- **Unit Tests**: 70% coverage (business logic)
- **Integration Tests**: 20% coverage (service interactions)
- **E2E Tests**: 10% coverage (user journeys)

#### Test Data Management

```typescript
// Factory pattern for test data
class TestDataFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: uuidv4() as UserId,
      clerk_id: `clerk_${uuidv4()}`,
      email: `test${Math.random()}@example.com`,
      first_name: "Test",
      last_name: "User",
      ...overrides,
    };
  }

  static createProduct(overrides?: Partial<Product>): Product {
    return {
      id: uuidv4() as ProductId,
      name: "Test Product",
      price: 99.99,
      stock_quantity: 100,
      ...overrides,
    };
  }
}
```

#### Property-Based Testing

```typescript
// Using fast-check for property testing
import * as fc from "fast-check";

describe("Order validation", () => {
  it("should reject orders with zero quantity", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (quantity) => {
        const order = TestDataFactory.createOrder({ quantity });
        return validateOrder(order).isValid;
      }),
    );
  });
});
```

## Security Improvements

### 1. Authentication & Authorization

**Current State**: Basic JWT validation
**Improvement**: Enhanced security measures

#### Rate Limiting Enhancement

```typescript
// Dynamic rate limiting based on user behavior
interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string;
  skip: (req: Request) => boolean;
  handler: (req: Request, res: Response) => void;
}

// Implementation
const rateLimit = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
  keyPrefix: "rl", // Prefix for storage
});
```

#### API Key Management

- **Rotation**: Automatic key rotation every 90 days
- **Scope**: Fine-grained permissions per API key
- **Audit**: Log all API key usage
- **Revocation**: Immediate revocation capability

### 2. Input Validation

**Current State**: Basic validation
**Improvement**: Comprehensive validation pipeline

```typescript
// Schema validation with Zod
import { z } from 'zod';

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive().max(100),
  })).min(1).max(20),
  shipping_address_id: z.string().uuid(),
  payment_method: z.enum(['card', 'paypal', 'apple_pay']),
}).strict();

// Usage with pipes
@Post('/orders')
@UsePipes(new ZodValidationPipe(CreateOrderSchema))
async createOrder(@Body() orderData: CreateOrderDto) {
  // Data is validated
}
```

### 3. Security Headers

**Current State**: Basic headers
**Improvement**: Comprehensive security headers

```typescript
// Security middleware
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy
    res.setHeader("Content-Security-Policy", "default-src 'self'");

    // HTTP Strict Transport Security
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );

    // X-Frame-Options
    res.setHeader("X-Frame-Options", "DENY");

    // X-Content-Type-Options
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");

    next();
  }
}
```

## Testing Improvements

### 1. Test Automation

**Current State**: Manual test execution
**Improvement**: CI/CD integrated testing

```yaml
# GitHub Actions workflow
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:ci
```

### 2. Performance Testing

**Current State**: No performance testing
**Improvement**: Regular load testing

```typescript
// Load test scenario
import { check, group } from "k6";

export default function () {
  group("Browse products", () => {
    const res = http.get("https://api.modularmart.com/v1/products");
    check(res, {
      "status is 200": (r) => r.status === 200,
      "response time < 200ms": (r) => r.timings.duration < 200,
    });
  });

  group("Add to cart", () => {
    const res = http.post(
      "https://api.modularmart.com/v1/cart/items",
      JSON.stringify({ product_id: "test", quantity: 1 }),
      { headers: { "Content-Type": "application/json" } },
    );
    check(res, {
      "status is 201": (r) => r.status === 201,
    });
  });
}
```

### 3. Chaos Engineering

**Current State**: No resilience testing
**Improvement**: Controlled failure injection

```typescript
// Chaos middleware
@Injectable()
export class ChaosMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const chaosConfig = this.configService.get("chaos");

    // Random latency injection
    if (
      chaosConfig?.latency &&
      Math.random() < chaosConfig.latency.probability
    ) {
      const delay = Math.random() * chaosConfig.latency.maxMs;
      setTimeout(next, delay);
      return;
    }

    // Error injection
    if (chaosConfig?.errors && Math.random() < chaosConfig.errors.probability) {
      res.status(500).json({ error: "Chaos engineering: Injected error" });
      return;
    }

    next();
  }
}
```

## Observability Improvements

### 1. Distributed Tracing

**Current State**: Basic correlation IDs
**Improvement**: Full distributed tracing

```typescript
// OpenTelemetry setup
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new JaegerExporter({
      serviceName: "user-service",
      endpoint: "http://jaeger:14268/api/traces",
    }),
  ),
);
provider.register();
```

### 2. Structured Logging

**Current State**: Basic JSON logging
**Improvement**: Enhanced structured logging

```typescript
// Enhanced logger
class StructuredLogger {
  info(message: string, context: Record<string, any> = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      ...context,
      service: this.serviceName,
      traceId: this.getTraceId(),
      spanId: this.getSpanId(),
    };

    console.log(JSON.stringify(logEntry));
  }

  // Additional methods for error, warn, debug
}

// Usage
logger.info("Order created", {
  orderId: order.id,
  userId: order.user_id,
  totalAmount: order.total_amount,
  itemCount: order.items.length,
});
```

### 3. Metrics Collection

**Current State**: No metrics
**Improvement**: Comprehensive metrics

```typescript
// Prometheus metrics
import { Counter, Gauge, Histogram } from "prom-client";

const orderCounter = new Counter({
  name: "orders_total",
  help: "Total number of orders",
  labelNames: ["status"],
});

const responseTimeHistogram = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Usage in middleware
responseTimeHistogram
  .labels(req.method, req.route.path, res.statusCode.toString())
  .observe(duration);
```

## Deployment Improvements

### 1. Infrastructure as Code

**Current State**: Basic Docker setup
**Improvement**: Complete IaC with Terraform

```hcl
# terraform/main.tf
resource "aws_ecs_cluster" "modular_mart" {
  name = "modular-mart-cluster"
}

resource "aws_ecs_task_definition" "api_gateway" {
  family = "api-gateway"
  container_definitions = jsonencode([
    {
      name      = "api-gateway"
      image     = "${aws_ecr_repository.api_gateway.repository_url}:latest"
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]
    }
  ])
}
```

### 2. Blue-Green Deployment

**Current State**: Basic deployment
**Improvement**: Zero-downtime deployments

```yaml
# GitHub Actions deployment
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            modularmart/api-gateway:latest
            modularmart/api-gateway:${{ github.sha }}

      - name: Deploy to Staging
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=modularmart/api-gateway:${{ github.sha }} \
            --namespace=staging

      - name: Run tests on staging
        run: ./scripts/run-staging-tests.sh

      - name: Promote to production
        if: success()
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=modularmart/api-gateway:${{ github.sha }} \
            --namespace=production
```

### 3. Disaster Recovery

**Current State**: Basic backups
**Improvement**: Comprehensive DR plan

```yaml
# Backup strategy
backup:
  databases:
    - name: user-db
      schedule: "0 2 * * *" # Daily at 2 AM
      retention: 30 days
      encryption: true

    - name: catalog-db
      schedule: "0 2 * * *"
      retention: 30 days
      encryption: true

  files:
    - path: /var/log
      schedule: "0 3 * * *"
      retention: 7 days

recovery:
  rto: 1 hour # Recovery Time Objective
  rpo: 15 minutes # Recovery Point Objective
  procedures:
    - database_restore.sh
    - service_restart.sh
    - validation_tests.sh
```

## Monitoring & Alerting

### 1. Alert Rules

**Current State**: No alerting
**Improvement**: Comprehensive alerting

```yaml
# prometheus/alert-rules.yml
groups:
  - name: modular-mart
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"
```

### 2. Dashboard Configuration

**Current State**: No dashboards
**Improvement**: Comprehensive Grafana dashboards

```json
{
  "dashboard": {
    "title": "Modular Mart Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate"
          }
        ]
      }
    ]
  }
}
```

---

_Last Updated: 2026-05-09_  
_Document Version: 1.0_

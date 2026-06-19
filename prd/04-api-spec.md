# Modular Mart - API Specification

## API Gateway Endpoints
**Base URL**: `http://localhost:8000/api` (Local) / `https://api.modularmart.com/api` (Prod)
*Note: The API Gateway is now implemented using Kong Gateway OSS.*

### Routing Strategy
- `/api/users/*` → User Service
- `/api/catalog/*` → Catalog Service
- `/api/products/*` → Catalog Service
- `/api/orders/*` → Order Service
- `/api/payments/*` → Payment Service
- `/api/notifications/*` → Notification Service

---

## User Service APIs

### 1. Get Profile
`GET /users/me` (Authenticated)
Returns the current user's profile and roles.

### 2. Clerk Webhook
`POST /users/webhook` (Public)
Handles `user.created` and `user.updated` events from Clerk.

---

## Catalog Service APIs

### 1. List Products
`GET /catalog/products` (Public)
Supports filtering by `categoryId`, `minPrice`, `maxPrice`, and `search`. Uses cursor-based pagination.

### 2. Get Product Batch
`RPC: products.get_batch` (Internal)
Used by Order Service to fetch product details for multiple IDs.

### 3. Seller: Create Product
`POST /catalog/products` (Seller/Admin)
Submits a new product for approval.

---

## Order Service APIs

### 1. Create Order
`POST /orders` (Authenticated)
Initializes the Checkout Saga. Returns a list of created orders (split by seller).

### 2. Track Order
`GET /orders/:id/track` (Authenticated)
Returns order details along with full status history timeline.

### 3. Seller: Get Stats
`GET /orders/seller/stats` (Seller)
Returns revenue, order counts, and status breakdown for the logged-in seller.

---

## Notification Service APIs

### 1. SSE Stream
`GET /notifications/stream` (Authenticated)
Server-Sent Events stream for real-time delivery of `NEW_NOTIFICATION` and `READ_STATUS_CHANGED`.

### 2. Get Preferences
`GET /notifications/preferences` (Authenticated)
Returns user opt-in settings for Email, SMS, and Push.

### 3. Mark All as Read
`PATCH /notifications/read-all` (Authenticated)
Marks all unread notifications for the user as read.

---

## Inter-Service Message Patterns (RabbitMQ)

| Pattern | Source | Target | Description |
| ------- | ------ | ------ | ----------- |
| `stock.reserve.requested` | Order | Catalog | Initiates pessimistic lock reservation. |
| `stock.reserved` | Catalog | Order | Confirms stock and moves order to `PAYMENT_PENDING`. |
| `order.created` | Order | Notification | Triggers initial order confirmation alert. |
| `payment.succeeded` | Payment | Order | Moves order to `PAID` status. |
| `payment.failed` | Payment | Catalog | Triggers compensation (stock release). |
| `order.status.updated` | Order | Notification | Syncs status changes to the user. |

## Health & Monitoring APIs

### 1. Health Check (Public)

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-09T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "rabbitmq": "connected",
    "stripe": "connected"
  },
  "version": "1.0.0"
}
```

### 2. Readiness Probe

**Endpoint**: `GET /ready`

**Response**: `200 OK` when ready to accept traffic

### 3. Liveness Probe

**Endpoint**: `GET /live`

**Response**: `200 OK` when service is alive

### 4. Kong Gateway Monitoring

**Metrics Endpoint**: `GET /kong-admin/metrics` (Admin API, internal only)
**Tracing**: Integrated with Jaeger via OpenTelemetry plugin.
**Logs**: Kong access logs are forwarded to Loki via Promtail.

**Key Metrics Exposed (via Prometheus plugin)**:
- Request latency (p50, p95, p99)
- Throughput (requests/second)
- Error rates (4xx, 5xx)
- Cache hit ratio
- Rate limit rejections
- Upstream health status

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ],
    "request_id": "req_123",
    "timestamp": "2026-05-09T10:30:00Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `RATE_LIMITED`: Too many requests
- `SERVICE_UNAVAILABLE`: Dependent service unavailable
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting
Kong Gateway now handles distributed rate limiting using a shared Redis instance for consistent enforcement across all API Gateway instances.

### Limits by Endpoint (Managed by Kong Gateway)

- **Public APIs**: 100 requests/minute per IP (global default)
- **Authenticated APIs**: 1000 requests/minute per user
- **Checkout APIs (Order Service)**: 50 requests/minute per user
- **Payment Processing APIs (Payment Service)**: 30 requests/minute per user
- **Admin APIs**: 5000 requests/minute per user

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1620547200
```

## Versioning

### URL Versioning

- Current: `/v1/*`
- Deprecated: `/v0/*` (if exists)
- Future: `/v2/*`

### Breaking Changes

1. Major version increment for breaking changes
2. Deprecation period of 6 months
3. Documentation of migration path
4. Backward compatibility where possible

## Important Contracts

### 1. Order Creation Contract

```typescript
interface OrderCreationRequest {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_address_id: string;
  payment_method: "card" | "paypal";
}

interface OrderCreationResponse {
  order_id: string;
  status: OrderStatus;
  total_amount: number;
  client_secret?: string;
  requires_action: boolean;
  payment_intent_id?: string;
}
```

### 2. Product Availability Contract

```typescript
interface ProductAvailabilityRequest {
  product_id: string;
  quantity: number;
}

interface ProductAvailabilityResponse {
  available: boolean;
  available_quantity: number;
  requires_backorder: boolean;
  estimated_restock_date?: string;
}
```

### 3. Payment Webhook Contract

```typescript
interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

interface PaymentWebhookResponse {
  processed: boolean;
  order_id?: string;
  payment_id?: string;
  status?: PaymentStatus;
}
```

### 4. Cart Contract

```typescript
interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  available: boolean;
  max_quantity: number;
}

interface CartResponse {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  expires_at: string;
}
```

## WebSocket Events (Future)

### Connection

```
wss://api.modularmart.com/ws
```

### Authentication

```json
{
  "type": "auth",
  "token": "jwt_token"
}
```

### Events

```json
{
  "type": "order_updated",
  "data": {
    "order_id": "uuid",
    "status": "SHIPPED",
    "updated_at": "2026-05-09T10:30:00Z"
  }
}
```

```json
{
  "type": "notification",
  "data": {
    "title": "Order Shipped",
    "message": "Your order has been shipped",
    "type": "info",
    "timestamp": "2026-05-09T10:30:00Z"
  }
}
```

## Testing Endpoints

### 1. Test Mode

**Header**: `X-Test-Mode: true`

**Behavior**:

- No real charges with Stripe
- Test data generation
- Bypass certain validations
- Faster processing

### 2. Mock Responses

**Query Parameter**: `?mock=true`

**Use**: For frontend development without backend

## API Documentation

### OpenAPI/Swagger

- **URL**: `/api-docs`
- **Format**: OpenAPI 3.0
- **Authentication**: Included in docs
- **Examples**: Request/response examples

### Postman Collection

- **Export**: Available from `/api-docs/export`
- **Environment**: Development, staging, production
- **Tests**: Included test scripts

### SDK Generation

- **Languages**: TypeScript, Python, Java, Go
- **Auto-generation**: From OpenAPI spec
- **Distribution**: NPM, PyPI, Maven

---

_Last Updated: 2026-05-09_  
_Document Version: 1.0_

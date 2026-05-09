# Modular Mart - API Specification

## API Gateway Endpoints

### Base URL

```
https://api.modularmart.com/v1
```

### Authentication

All endpoints require JWT authentication via Clerk unless specified as public.

**Header**:

```
Authorization: Bearer <clerk_jwt_token>
```

## User Service APIs

### 1. Get Current User Profile

**Endpoint**: `GET /users/me`

**Response**:

```json
{
  "id": "uuid",
  "clerk_id": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "roles": ["CUSTOMER", "SELLER", "ADMIN"],
  "created_at": "2026-05-09T10:30:00Z",
  "updated_at": "2026-05-09T10:30:00Z"
}
```

**Errors**:

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found in local database

### 2. Update User Profile

**Endpoint**: `PATCH /users/me`

**Request**:

```json
{
  "first_name": "string",
  "last_name": "string"
}
```

**Response**: Updated user profile

### 3. List User Addresses

**Endpoint**: `GET /users/me/addresses`

**Response**:

```json
{
  "addresses": [
    {
      "id": "uuid",
      "street": "string",
      "city": "string",
      "state": "string",
      "postal_code": "string",
      "country": "string",
      "is_default": true,
      "created_at": "2026-05-09T10:30:00Z",
      "updated_at": "2026-05-09T10:30:00Z"
    }
  ]
}
```

### 4. Create Address

**Endpoint**: `POST /users/me/addresses`

**Request**:

```json
{
  "street": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "postal_code": "94105",
  "country": "US",
  "is_default": false
}
```

**Response**: Created address with ID

### 5. Set Default Address

**Endpoint**: `PUT /users/me/addresses/{address_id}/default`

**Response**: Success message

## Catalog Service APIs

### 1. List Categories (Public)

**Endpoint**: `GET /categories`

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**:

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and accessories",
      "product_count": 150,
      "created_at": "2026-05-09T10:30:00Z",
      "updated_at": "2026-05-09T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 2. Get Category Details (Public)

**Endpoint**: `GET /categories/{slug}`

**Response**: Category details with products

### 3. List Products (Public)

**Endpoint**: `GET /products`

**Query Parameters**:

- `category`: Category slug filter
- `search`: Text search in name/description
- `min_price`, `max_price`: Price range filter
- `in_stock`: Boolean filter for availability
- `sort`: `price_asc`, `price_desc`, `newest`, `popular`
- `page`, `limit`: Pagination

**Response**:

```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "description": "Premium wireless headphones with noise cancellation",
      "price": 199.99,
      "stock_quantity": 50,
      "category": {
        "id": "uuid",
        "name": "Electronics",
        "slug": "electronics"
      },
      "images": ["url1", "url2"],
      "created_at": "2026-05-09T10:30:00Z",
      "updated_at": "2026-05-09T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "pages": 50
  },
  "filters": {
    "price_range": { "min": 10, "max": 1000 },
    "categories": ["electronics", "clothing"]
  }
}
```

### 4. Get Product Details (Public)

**Endpoint**: `GET /products/{slug}`

**Response**: Detailed product information

### 5. Check Product Availability

**Endpoint**: `GET /products/{product_id}/availability`

**Query Parameters**:

- `quantity`: Required quantity (default: 1)

**Response**:

```json
{
  "available": true,
  "available_quantity": 50,
  "requires_backorder": false,
  "estimated_restock_date": "2026-05-15"
}
```

## Order Service APIs

### 1. Create Order

**Endpoint**: `POST /orders`

**Request**:

```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ],
  "shipping_address_id": "uuid",
  "payment_method": "card" // card, paypal, etc.
}
```

**Response**:

```json
{
  "order_id": "uuid",
  "status": "PENDING",
  "total_amount": 399.98,
  "client_secret": "pi_xxx_secret_xxx", // Stripe client secret
  "requires_action": false,
  "payment_intent_id": "pi_xxx"
}
```

### 2. Get Order Details

**Endpoint**: `GET /orders/{order_id}`

**Response**:

```json
{
  "id": "uuid",
  "user_id": "clerk_user_id",
  "status": "PAID",
  "total_amount": 399.98,
  "items": [
    {
      "product_id": "uuid",
      "name": "Wireless Headphones",
      "quantity": 2,
      "unit_price": 199.99,
      "subtotal": 399.98
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "US"
  },
  "payments": [
    {
      "id": "uuid",
      "amount": 399.98,
      "status": "SUCCESS",
      "stripe_payment_intent_id": "pi_xxx",
      "created_at": "2026-05-09T10:30:00Z"
    }
  ],
  "created_at": "2026-05-09T10:30:00Z",
  "updated_at": "2026-05-09T10:30:00Z"
}
```

### 3. List User Orders

**Endpoint**: `GET /users/me/orders`

**Query Parameters**:

- `status`: Filter by order status
- `from_date`, `to_date`: Date range filter
- `page`, `limit`: Pagination

**Response**: List of user's orders with pagination

### 4. Cancel Order

**Endpoint**: `POST /orders/{order_id}/cancel`

**Request**:

```json
{
  "reason": "Changed my mind"
}
```

**Response**: Updated order status

## Payment Service APIs (Implemented)

### 1. Create Payment Intent

**Endpoint**: `POST /payments/intents`

**Request**:

```json
{
  "order_id": "uuid",
  "amount": 399.98,
  "currency": "usd",
  "payment_method_types": ["card"]
}
```

**Response**: Stripe payment intent with client secret

### 2. Handle Payment Webhook (Implemented)

**Endpoint**: `POST /payments/webhook`

**Headers**:

- `Stripe-Signature`: Webhook signature for verification

**Request**: Raw Stripe webhook event

**Response**: `200 OK` on successful processing

### 3. Process Refund

**Endpoint**: `POST /payments/{payment_id}/refund`

**Request**:

```json
{
  "amount": 199.99,
  "reason": "defective_product"
}
```

**Response**: Refund details

## Cart Service APIs (Future)

### 1. Get Cart

**Endpoint**: `GET /cart`

**Response**:

```json
{
  "id": "session_id",
  "items": [
    {
      "product_id": "uuid",
      "name": "Wireless Headphones",
      "quantity": 2,
      "price": 199.99,
      "image": "url",
      "available": true,
      "max_quantity": 50
    }
  ],
  "subtotal": 399.98,
  "tax": 32.0,
  "shipping": 0.0,
  "total": 431.98,
  "expires_at": "2026-05-16T10:30:00Z"
}
```

### 2. Add to Cart

**Endpoint**: `POST /cart/items`

**Request**:

```json
{
  "product_id": "uuid",
  "quantity": 1
}
```

**Response**: Updated cart

### 3. Update Cart Item

**Endpoint**: `PUT /cart/items/{product_id}`

**Request**:

```json
{
  "quantity": 3
}
```

**Response**: Updated cart

### 4. Remove from Cart

**Endpoint**: `DELETE /cart/items/{product_id}`

**Response**: Updated cart

### 5. Clear Cart

**Endpoint**: `DELETE /cart`

**Response**: Empty cart

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

### Limits by Endpoint

- **Public APIs**: 100 requests/minute per IP
- **Authenticated APIs**: 1000 requests/minute per user
- **Checkout APIs**: 10 requests/minute per user
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

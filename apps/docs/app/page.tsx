import { ApiEndpoint } from './components/ApiEndpoint';

export default function Page() {
  return (
    <div>
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Microservices API
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          Welcome to the API reference. These endpoints power the e-commerce microservices, providing user management, product catalog, ordering, and payments.
        </p>
      </div>

      <div className="space-y-12">
        {/* User Service */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            User Service
          </h2>
          <p className="text-slate-600 mb-8">
            The User Service (port `3001` locally, `8000` via API Gateway) handles user profiles and synchronization with Clerk authentication webhooks.
          </p>
          
          <ApiEndpoint
            id="get-users-me"
            title="Get Current User Profile"
            method="GET"
            endpoint="/api/users/me"
            description={
              <>
                <p>
                  Retrieves the profile of the currently authenticated user from the database. 
                  This endpoint relies on the Clerk JWT token passed in the Authorization header.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Note: The database user profile is created automatically by Clerk webhooks upon sign-up. 
                  If a user signs up but fetches their profile instantly, it may return a 404 until the webhook finishes processing.
                </p>
              </>
            }
            headers={[
              {
                name: 'Authorization',
                required: true,
                description: 'Bearer token from Clerk (e.g., `Bearer eyJhbG...`)',
              },
            ]}
            responseShape={`{
  "id": "uuid-string",
  "clerkId": "user_2Pabc123xyz",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER",
  "createdAt": "2026-03-25T15:00:00.000Z",
  "updatedAt": "2026-03-25T15:00:00.000Z"
}`}
          />

          <ApiEndpoint
            id="post-users-webhooks-clerk"
            title="Clerk Webhook Synchronization"
            method="POST"
            endpoint="/api/users/webhooks/clerk"
            description={
              <>
                <p>
                  This is a secure machine-to-machine endpoint intended <strong>only</strong> for Clerk webhooks. 
                  It receives events (like <code>user.created</code>, <code>user.updated</code>, <code>user.deleted</code>) 
                  and synchronizes the Postgres database to match the state in Clerk.
                </p>
                <p className="mt-2 p-3 bg-yellow-50 text-yellow-800 rounded text-sm font-medium border border-yellow-200">
                  Authentication: This endpoint uses HMAC-SHA256 signature verification over the raw request body. 
                  It does not use standard Bearer tokens.
                </p>
              </>
            }
            headers={[
               { name: 'svix-id', required: true, description: 'The unique message ID.' },
               { name: 'svix-timestamp', required: true, description: 'Message timestamp (Unix epoch).' },
               { name: 'svix-signature', required: true, description: 'The HMAC-SHA256 signature(s).' },
            ]}
            bodyParams={[
              { name: 'type', type: 'string', required: true, description: 'Event type (e.g., "user.created").' },
              { name: 'data', type: 'object', required: true, description: 'Clerk User JSON payload.' }
            ]}
            responseShape={`{ "success": true }`}
          />
        </div>

        {/* Catalog & Orders Service */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            Catalog & Orders Service
          </h2>
          <p className="text-slate-600 mb-8">
            The Catalog & Orders Service (port `3002` locally, `8000` via API Gateway) handles products, categories, shopping carts, orders, and payments.
          </p>
          
          <ApiEndpoint
            id="get-catalog-products"
            title="List Products"
            method="GET"
            endpoint="/api/catalog/products"
            description="Retrieve a list of available products. Optionally filter by category ID."
            queryParams={[
               { name: 'categoryId', type: 'string', required: false, description: 'Filter products by a specific category ID.' }
            ]}
            responseShape={`[
  {
    "id": "uuid",
    "slug": "product-name",
    "name": "Product Name",
    "description": "Product Description",
    "price": 99.99,
    "inventory": 100,
    "categoryId": "uuid"
  }
]`}
          />

          <ApiEndpoint
            id="get-catalog-products-slug"
            title="Get Product Details"
            method="GET"
            endpoint="/api/catalog/products/:slug"
            description="Retrieve full details for a single product by its slug."
            pathParams={[
               { name: 'slug', type: 'string', required: true, description: 'The URL-friendly slug of the product.' }
            ]}
            responseShape={`{
  "id": "uuid",
  "slug": "product-name",
  "name": "Product Name",
  "description": "Detailed description...",
  "price": 99.99,
  "inventory": 100,
  "categoryId": "uuid"
}`}
          />

          <ApiEndpoint
            id="get-catalog-categories"
            title="List Categories"
            method="GET"
            endpoint="/api/catalog/categories"
            description="Retrieve all product categories."
            responseShape={`[
  {
    "id": "uuid",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic items."
  }
]`}
          />

          <ApiEndpoint
            id="post-catalog-products"
            title="Create Product"
            method="POST"
            endpoint="/api/catalog/products"
            description="Admin only. Creates a new product in the catalog."
            headers={[
              { name: 'Authorization', required: true, description: 'Bearer token from Clerk' },
            ]}
            bodyParams={[
              { name: 'name', type: 'string', required: true, description: 'Product name' },
              { name: 'slug', type: 'string', required: true, description: 'URL friendly slug' },
              { name: 'price', type: 'number', required: true, description: 'Price in USD' },
              { name: 'inventory', type: 'number', required: true, description: 'Available stock quantity' },
              { name: 'categoryId', type: 'string', required: true, description: 'Category ID' }
            ]}
            responseShape={`{
  "id": "uuid",
  "name": "New Product",
  "price": 50,
  "inventory": 10
}`}
          />

          <ApiEndpoint
            id="post-orders"
            title="Create Order"
            method="POST"
            endpoint="/api/orders"
            description="Creates a new order from a list of items and generates a pending checkout session."
            headers={[
              { name: 'Authorization', required: true, description: 'Bearer token from Clerk' },
            ]}
            bodyParams={[
              { name: 'items', type: 'Array<{productId, quantity}>', required: true, description: 'List of product IDs and quantities' },
              { name: 'shippingAddressId', type: 'string', required: false, description: 'Optional saved address ID' }
            ]}
            responseShape={`{
  "id": "order-uuid",
  "userId": "user_id",
  "status": "PENDING",
  "totalAmount": 150.00,
  "items": [...]
}`}
          />

          <ApiEndpoint
            id="get-orders"
            title="List User Orders"
            method="GET"
            endpoint="/api/orders"
            description="Retrieves all orders placed by the currently authenticated user."
            headers={[
              { name: 'Authorization', required: true, description: 'Bearer token from Clerk' },
            ]}
            responseShape={`[
  {
    "id": "order-uuid",
    "status": "PAID",
    "totalAmount": 150.00,
    "createdAt": "2026-03-25T15:00:00.000Z"
  }
]`}
          />

          <ApiEndpoint
            id="get-orders-id"
            title="Get Order Details"
            method="GET"
            endpoint="/api/orders/:id"
            description="Retrieves detailed information for a specific order belonging to the authenticated user."
            headers={[
              { name: 'Authorization', required: true, description: 'Bearer token from Clerk' },
            ]}
            pathParams={[
               { name: 'id', type: 'string', required: true, description: 'The order UUID.' }
            ]}
            responseShape={`{
  "id": "order-uuid",
  "status": "PAID",
  "totalAmount": 150.00,
  "items": [
    { "productId": "uuid", "quantity": 2, "price": 75.00 }
  ]
}`}
          />

          <ApiEndpoint
            id="post-payments-stripe-webhook"
            title="Stripe Webhook (Payment Sync)"
            method="POST"
            endpoint="/api/payments/stripe-webhook"
            description="Stripe webhook endpoint to handle asynchronous payment events (e.g. checkout.session.completed)."
            bodyParams={[
              { name: 'id', type: 'string', required: true, description: 'Stripe event ID' },
              { name: 'type', type: 'string', required: true, description: 'Stripe event type (e.g., checkout.session.completed)' },
              { name: 'data', type: 'object', required: true, description: 'Event payload object' }
            ]}
            responseShape={`{ "received": true }`}
          />
        </div>
      </div>
    </div>
  );
}

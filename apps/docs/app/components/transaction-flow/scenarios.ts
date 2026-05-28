export const transactionScenarios = {
  success: {
    name: 'Successful Order Saga (Choreographed)',
    steps: [
      {
        title: 'Frontend initiates checkout',
        description: 'User clicks "Place Order", sending a request to the API Gateway.',
        type: 'code',
        details: {
          request: {
            method: 'POST',
            path: '/orders',
            payload: {
              items: [{ productId: 'prod_A', quantity: 2 }],
              shippingAddressId: 'addr_1',
            },
          },
          telemetry: {
            traceId: 'trace_checkout_001',
            span: 'web.checkout',
          },
        },
      },
      {
        title: 'API Gateway: Auth & Ingress',
        description: 'Authenticates user via Clerk, attaches correlation ID, and forwards to Order Service.',
        type: 'code',
        details: {
          ingress: {
            service: 'API Gateway',
            clerkAuth: 'VALID',
            correlationId: 'ord_92A1',
            traceId: 'trace_checkout_001',
          },
        },
      },
      {
        title: 'Order Service: Transaction Begins',
        description: 'Starts a database transaction to ensure Order and Outbox entry are saved atomically.',
        type: 'database',
        details: {
          sql: 'BEGIN;',
          traceId: 'trace_checkout_001',
        },
      },
      {
        title: 'Order Service: Create Order (PENDING_STOCK)',
        description: 'Inserts order record with initial state set to PENDING_STOCK.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'INSERT',
          record: {
            id: 'ord_92A1',
            status: 'PENDING_STOCK',
            totalAmount: 299.00,
            correlationId: 'ord_92A1',
          },
        },
      },
      {
        title: 'Order Service: Record Outbox Event',
        description: 'Saves STOCK_RESERVE_REQUESTED event in the outbox table within the same transaction.',
        type: 'database',
        details: {
          table: 'outbox_events',
          action: 'INSERT',
          event: {
            type: 'STOCK_RESERVE_REQUESTED',
            payload: {
              orderId: 'ord_92A1',
              items: [{ productId: 'prod_A', quantity: 2 }],
            },
          },
        },
      },
      {
        title: 'Order Service: Commit & Ack',
        description: 'Commits DB transaction and returns success to frontend immediately.',
        type: 'database',
        details: {
          sql: 'COMMIT;',
          response: { status: 201, orderId: 'ord_92A1' },
        },
      },
      {
        title: 'Outbox Processor: Publish Event',
        description: 'Background worker polls outbox and publishes the event to RabbitMQ.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          exchange: 'mart.events',
          routingKey: 'stock.reserve_requested',
          payload: {
            eventType: 'STOCK_RESERVE_REQUESTED',
            orderId: 'ord_92A1',
            traceId: 'trace_checkout_001',
          },
        },
      },
      {
        title: 'Catalog Service: Consume Reservation Request',
        description: 'Catalog Service picks up the request and starts its own reservation transaction.',
        type: 'event',
        details: {
          service: 'Catalog Service',
          event: 'STOCK_RESERVE_REQUESTED',
          traceId: 'trace_checkout_001',
          span: 'catalog.reserve_stock',
        },
      },
      {
        title: 'Catalog Service: Pessimistic Lock',
        description: 'Locks the product rows for update to prevent overselling during high concurrency.',
        type: 'database',
        details: {
          sql: 'SELECT * FROM products WHERE id = "prod_A" FOR UPDATE;',
          result: 'ROW_LOCKED',
        },
      },
      {
        title: 'Catalog Service: Commit & Publish Status',
        description: 'Updates stock levels, commits, and publishes STOCK_RESERVED event via its own outbox.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          eventType: 'STOCK_RESERVED',
          payload: {
            orderId: 'ord_92A1',
            status: 'SUCCESS',
          },
        },
      },
      {
        title: 'Order Service: Consume STOCK_RESERVED',
        description: 'Order Service receives confirmation that stock is locked and ready.',
        type: 'event',
        details: {
          service: 'Order Service',
          event: 'STOCK_RESERVED',
          traceId: 'trace_checkout_001',
        },
      },
      {
        title: 'Order Service: Transition to PAYMENT_PENDING',
        description: 'Updates order status and publishes ORDER_CREATED to trigger payment/notifications.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'UPDATE',
          changes: { status: 'PAYMENT_PENDING' },
          outbox: 'ORDER_CREATED',
        },
      },
      {
        title: 'Payment Service: Process Payment',
        description: 'Consumes ORDER_CREATED, calls Stripe, and publishes results.',
        type: 'code',
        details: {
          stripe: { status: 'SUCCEEDED', paymentId: 'pi_abc123' },
          outbox: 'PAYMENT_SUCCEEDED',
        },
      },
      {
        title: 'Order Service: Finalize (PAID)',
        description: 'Consumes PAYMENT_SUCCEEDED, verifies idempotency, and marks order as PAID.',
        type: 'database',
        details: {
          table: 'orders',
          status: 'PAID',
          idempotency: {
            table: 'processed_messages',
            key: 'pi_abc123',
            result: 'NEW_PROCESS',
          },
        },
      },
    ],
  },
  stockFailure: {
    name: 'Compensation: Stock Reservation Failure',
    steps: [
      {
        title: 'Order Created (PENDING_STOCK)',
        description: 'Order starts in PENDING_STOCK state.',
        type: 'database',
        details: { status: 'PENDING_STOCK', orderId: 'ord_FAIL_01' },
      },
      {
        title: 'Catalog Service: Reservation Attempt',
        description: 'Catalog Service finds that stock is insufficient for one or more items.',
        type: 'error',
        details: {
          check: 'quantity > available',
          product: 'prod_B',
          available: 0,
          requested: 5,
        },
      },
      {
        title: 'Catalog Service: Publish Failure',
        description: 'Publishes STOCK_RESERVE_FAILED event.',
        type: 'event',
        details: {
          eventType: 'STOCK_RESERVE_FAILED',
          payload: { orderId: 'ord_FAIL_01', reason: 'INSUFFICIENT_STOCK' },
        },
      },
      {
        title: 'Order Service: Consume Failure',
        description: 'Order Service reacts to the stock reservation failure.',
        type: 'event',
        details: { event: 'STOCK_RESERVE_FAILED', traceId: 'trace_fail_01' },
      },
      {
        title: 'Order Service: Transition to STOCK_FAILED',
        description: 'Updates order status to STOCK_FAILED as a terminal state.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'UPDATE',
          changes: {
            status: 'STOCK_FAILED',
            rejectReason: 'Insufficient stock',
          },
        },
      },
    ],
  },
  paymentFailure: {
    name: 'Compensation: Payment Failure Rollback',
    steps: [
      {
        title: 'Stock Successfully Reserved',
        description: 'Saga has progressed to PAYMENT_PENDING.',
        type: 'code',
        details: { status: 'PAYMENT_PENDING', stock: 'RESERVED' },
      },
      {
        title: 'Payment Service: Stripe Declined',
        description: 'External payment provider rejects the transaction.',
        type: 'error',
        details: {
          stripeError: 'card_declined',
          reason: 'insufficient_funds',
        },
      },
      {
        title: 'Payment Service: Publish Failure',
        description: 'Publishes PAYMENT_FAILED event.',
        type: 'event',
        details: {
          eventType: 'PAYMENT_FAILED',
          payload: { orderId: 'ord_FAIL_02', reason: 'PAYMENT_DECLINED' },
        },
      },
      {
        title: 'Order Service: Trigger Compensation',
        description: 'Consumes PAYMENT_FAILED and initiates rollback by cancelling the order.',
        type: 'database',
        details: {
          table: 'orders',
          status: 'CANCELLED',
          outbox: 'ORDER_CANCELLED',
        },
      },
      {
        title: 'Catalog Service: Compensating Action',
        description: 'Consumes ORDER_CANCELLED and releases the previously reserved stock.',
        type: 'database',
        details: {
          action: 'RELEASE_STOCK',
          items: [{ productId: 'prod_A', quantity: 2 }],
          logic: 'UPDATE products SET stock = stock + 2 WHERE id = "prod_A"',
        },
      },
    ],
  },
};

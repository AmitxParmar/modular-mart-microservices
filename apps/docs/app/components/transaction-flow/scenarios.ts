export const transactionScenarios = {
  success: {
    name: 'Successful Order Transaction',
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
              items: [{ sku: 'SKU-1', qty: 2 }],
              userId: 'user-123',
            },
          },
        },
      },
      {
        title: 'API Gateway processes request',
        description: 'Authenticates user, attaches correlation ID, and forwards to Order Service.',
        type: 'code',
        details: {
          processed: {
            jwtVerified: true,
            correlationId: 'ord_92A1',
          },
        },
      },
      {
        title: 'Order Service: Transaction begins',
        description: 'Starts a database transaction for order creation and outbox entry.',
        type: 'database',
        details: {
          sqlTransaction: 'BEGIN;',
        },
      },
      {
        title: 'Order Service: Create Order',
        description: 'Inserts a new order record into the `orders` table.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'INSERT',
          record: {
            id: 'ord_92A1',
            userId: 'user-123',
            status: 'PENDING',
            total: 149.00,
            createdAt: '2026-05-19T10:00:00Z',
          },
        },
      },
      {
        title: 'Order Service: Add Outbox Event',
        description: 'Inserts an `ORDER_CREATED` event into the `outbox_events` table.',
        type: 'database',
        details: {
          table: 'outbox_events',
          action: 'INSERT',
          record: {
            id: 'evt_1',
            aggregateType: 'Order',
            aggregateId: 'ord_92A1',
            eventType: 'ORDER_CREATED',
            payload: {
              orderId: 'ord_92A1',
              items: [{ sku: 'SKU-1', qty: 2 }],
              total: 149.00,
            },
            processed: false,
            createdAt: '2026-05-19T10:00:01Z',
          },
        },
      },
      {
        title: 'Order Service: Commit Transaction',
        description: 'Commits the database transaction, making order and outbox entry visible.',
        type: 'database',
        details: {
          sqlTransaction: 'COMMIT;',
        },
      },
      {
        title: 'Outbox Relayer: Poll for events',
        description: 'Dedicated process polls `outbox_events` for unprocessed events.',
        type: 'code',
        details: {
          query: 'SELECT * FROM outbox_events WHERE processed = false LIMIT 10;',
        },
      },
      {
        title: 'Outbox Relayer: Publish ORDER_CREATED event',
        description: 'Publishes `ORDER_CREATED` to RabbitMQ and marks it as processed.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          exchange: 'orders.topic',
          routingKey: 'order.created',
          payload: {
            event: 'ORDER_CREATED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            items: [{ sku: 'SKU-1', qty: 2 }],
            total: 149.00,
          },
        },
      },
      {
        title: 'Payment Service: Consume ORDER_CREATED',
        description: 'Payment Service consumes the `ORDER_CREATED` event from RabbitMQ.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          queue: 'payment.order.created',
          payload: {
            event: 'ORDER_CREATED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            items: [{ sku: 'SKU-1', qty: 2 }],
            total: 149.00,
          },
        },
      },
      {
        title: 'Payment Service: Process Idempotency Key',
        description: 'Checks `processed_messages` table to prevent duplicate processing.',
        type: 'database',
        details: {
          table: 'processed_messages',
          action: 'SELECT',
          query: "SELECT * FROM processed_messages WHERE message_id = 'evt_1';",
          result: 'No existing record, proceed.',
        },
      },
      {
        title: 'Payment Service: Initiate payment with Stripe',
        description: 'Calls external Stripe API to create a payment charge.',
        type: 'code',
        details: {
          externalCall: {
            service: 'Stripe',
            method: 'POST',
            endpoint: '/charges',
            payload: {
              amount: 14900,
              currency: 'usd',
              orderId: 'ord_92A1',
              // ... other payment details
            },
          },
        },
      },
      {
        title: 'Payment Service: Record payment',
        description: 'Inserts payment record into `payments` table.',
        type: 'database',
        details: {
          table: 'payments',
          action: 'INSERT',
          record: {
            id: 'pay_xyz',
            orderId: 'ord_92A1',
            amount: 149.00,
            status: 'SUCCEEDED',
            externalId: 'ch_123abc',
          },
        },
      },
      {
        title: 'Payment Service: Publish PAYMENT_SUCCEEDED',
        description: 'Emits `PAYMENT_SUCCEEDED` event to RabbitMQ via its own outbox.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          exchange: 'payments.topic',
          routingKey: 'payment.succeeded',
          payload: {
            event: 'PAYMENT_SUCCEEDED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            paymentId: 'pay_xyz',
          },
        },
      },
      {
        title: 'Order Service: Consume PAYMENT_SUCCEEDED',
        description: 'Order Service consumes the `PAYMENT_SUCCEEDED` event.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          queue: 'order.payment.succeeded',
          payload: {
            event: 'PAYMENT_SUCCEEDED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            paymentId: 'pay_xyz',
          },
        },
      },
      {
        title: 'Order Service: Update Order Status',
        description: 'Updates the order status to `COMPLETED` in the `orders` table.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'UPDATE',
          recordId: 'ord_92A1',
          changes: {
            status: 'COMPLETED',
          },
        },
      },
      {
        title: 'Transaction Completed',
        description: 'The distributed transaction for the order is successfully completed.',
        type: 'code',
        details: {
          status: 'SUCCESS',
          message: 'Order processed and payment confirmed.',
        },
      },
    ],
  },
  paymentFailure: {
    name: 'Payment Failure Scenario',
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
              items: [{ sku: 'SKU-1', qty: 2 }],
              userId: 'user-123',
            },
          },
        },
      },
      {
        title: 'API Gateway processes request',
        description: 'Authenticates user, attaches correlation ID, and forwards to Order Service.',
        type: 'code',
        details: {
          processed: {
            jwtVerified: true,
            correlationId: 'ord_92A1',
          },
        },
      },
      {
        title: 'Order Service: Transaction begins',
        description: 'Starts a database transaction for order creation and outbox entry.',
        type: 'database',
        details: {
          sqlTransaction: 'BEGIN;',
        },
      },
      {
        title: 'Order Service: Create Order',
        description: 'Inserts a new order record into the `orders` table.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'INSERT',
          record: {
            id: 'ord_92A1',
            userId: 'user-123',
            status: 'PENDING',
            total: 149.00,
            createdAt: '2026-05-19T10:00:00Z',
          },
        },
      },
      {
        title: 'Order Service: Add Outbox Event',
        description: 'Inserts an `ORDER_CREATED` event into the `outbox_events` table.',
        type: 'database',
        details: {
          table: 'outbox_events',
          action: 'INSERT',
          record: {
            id: 'evt_1',
            aggregateType: 'Order',
            aggregateId: 'ord_92A1',
            eventType: 'ORDER_CREATED',
            payload: {
              orderId: 'ord_92A1',
              items: [{ sku: 'SKU-1', qty: 2 }],
              total: 149.00,
            },
            processed: false,
            createdAt: '2026-05-19T10:00:01Z',
          },
        },
      },
      {
        title: 'Order Service: Commit Transaction',
        description: 'Commits the database transaction, making order and outbox entry visible.',
        type: 'database',
        details: {
          sqlTransaction: 'COMMIT;',
        },
      },
      {
        title: 'Outbox Relayer: Poll for events',
        description: 'Dedicated process polls `outbox_events` for unprocessed events.',
        type: 'code',
        details: {
          query: 'SELECT * FROM outbox_events WHERE processed = false LIMIT 10;',
        },
      },
      {
        title: 'Outbox Relayer: Publish ORDER_CREATED event',
        description: 'Publishes `ORDER_CREATED` to RabbitMQ and marks it as processed.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          exchange: 'orders.topic',
          routingKey: 'order.created',
          payload: {
            event: 'ORDER_CREATED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            items: [{ sku: 'SKU-1', qty: 2 }],
            total: 149.00,
          },
        },
      },
      {
        title: 'Payment Service: Consume ORDER_CREATED',
        description: 'Payment Service consumes the `ORDER_CREATED` event from RabbitMQ.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          queue: 'payment.order.created',
          payload: {
            event: 'ORDER_CREATED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            items: [{ sku: 'SKU-1', qty: 2 }],
            total: 149.00,
          },
        },
      },
      {
        title: 'Payment Service: Process Idempotency Key',
        description: 'Checks `processed_messages` table to prevent duplicate processing.',
        type: 'database',
        details: {
          table: 'processed_messages',
          action: 'SELECT',
          query: "SELECT * FROM processed_messages WHERE message_id = 'evt_1';",
          result: 'No existing record, proceed.',
        },
      },
      {
        title: 'Payment Service: Initiate payment with Stripe (Failure)',
        description: 'Attempts to call external Stripe API, but it fails.',
        type: 'error',
        details: {
          externalCall: {
            service: 'Stripe',
            method: 'POST',
            endpoint: '/charges',
            payload: {
              amount: 14900,
              currency: 'usd',
              orderId: 'ord_92A1',
            },
          },
          error: {
            type: 'StripeError',
            message: 'Payment declined: insufficient funds.',
            statusCode: 402,
          },
        },
      },
      {
        title: 'Payment Service: Publish PAYMENT_FAILED',
        description: 'Emits `PAYMENT_FAILED` event to RabbitMQ via its own outbox.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          exchange: 'payments.topic',
          routingKey: 'payment.failed',
          payload: {
            event: 'PAYMENT_FAILED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            reason: 'Insufficient funds',
          },
        },
      },
      {
        title: 'Order Service: Consume PAYMENT_FAILED',
        description: 'Order Service consumes the `PAYMENT_FAILED` event.',
        type: 'event',
        details: {
          broker: 'RabbitMQ',
          queue: 'order.payment.failed',
          payload: {
            event: 'PAYMENT_FAILED',
            correlationId: 'ord_92A1',
            orderId: 'ord_92A1',
            reason: 'Insufficient funds',
          },
        },
      },
      {
        title: 'Order Service: Initiate Saga Rollback',
        description: 'Updates order status to `CANCELLED` and potentially triggers compensating actions.',
        type: 'database',
        details: {
          table: 'orders',
          action: 'UPDATE',
          recordId: 'ord_92A1',
          changes: {
            status: 'CANCELLED',
            reason: 'Payment failed',
          },
        },
      },
      {
        title: 'Transaction Rollback Completed',
        description: 'The distributed transaction for the order has been rolled back.',
        type: 'error',
        details: {
          status: 'ROLLED_BACK',
          message: 'Order cancelled due to payment failure.',
        },
      },
    ],
  },
};

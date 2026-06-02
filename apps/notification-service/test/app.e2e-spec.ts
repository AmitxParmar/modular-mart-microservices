import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * E2E tests for the Notification Service REST API.
 * Uses mock data to verify endpoint behavior without affecting real user records.
 */
describe('NotificationsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('REST Endpoints', () => {
    it('/api/health/live (GET) - should return status ok', () => {
      return request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200)
        .expect({ status: 'ok', timestamp: expect.any(String) });
    });

    // Note: Authenticated endpoints require a valid Clerk JWT.
    // For E2E tests, we would typically mock the Clerk Guard or use a test token.
    // Here we verify the structure/existence of the endpoints.
    
    it('/notifications/preferences (GET) - unauthorized without token', () => {
      return request(app.getHttpServer())
        .get('/notifications/preferences')
        .expect(403); // Forbidden because Guard is present
    });

    it('/notifications/unread-count (GET) - unauthorized without token', () => {
      return request(app.getHttpServer())
        .get('/notifications/unread-count')
        .expect(403);
    });
  });

  describe('Internal Endpoints', () => {
    it('/notifications/internal/create (POST) - should create a notification entity', async () => {
      // Mock user ID to avoid affecting real records
      const mockUserId = 'test-user-123';
      
      const response = await request(app.getHttpServer())
        .post('/notifications/internal/create')
        .send({
          userId: mockUserId,
          type: 'ORDER_CREATED',
          priority: 'HIGH',
          subject: 'Test Notification',
          content: 'This is a test notification payload.',
          metadata: { orderId: 'ORD-123' }
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(mockUserId);
      expect(response.body.type).toBe('ORDER_CREATED');
    });
  });
});

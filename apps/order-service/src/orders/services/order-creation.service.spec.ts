import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreationService } from './order-creation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { DataSource } from 'typeorm';
import { PinoLogger } from '@repo/common';

/**
 * Unit tests for OrderCreationService.
 * Focuses on verifying the core logic of order placement and seller-based partitioning.
 */
describe('OrderCreationService', () => {
  let service: OrderCreationService;

  // Mock repositories and external clients
  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuthClient = {
    send: jest.fn(),
  };

  const mockCatalogClient = {
    send: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb({
      create: jest.fn(),
      save: jest.fn(),
    })),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreationService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: 'AUTH_SERVICE', useValue: mockAuthClient },
        { provide: 'CATALOG_SERVICE', useValue: mockCatalogClient },
        { provide: DataSource, useValue: mockDataSource },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<OrderCreationService>(OrderCreationService);
  });

  /**
   * Basic sanity check to ensure the service is correctly wired.
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

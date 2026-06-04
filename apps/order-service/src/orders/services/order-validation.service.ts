import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@repo/contracts';

/**
 * Service responsible for validating order state transitions.
 * Ensures that orders follow the correct lifecycle path.
 */
@Injectable()
export class OrderValidationService {
  /**
   * Validates if a transition from a current status to a target status is allowed.
   * 
   * @param current - The current status of the order.
   * @param target - The desired new status for the order.
   * @returns boolean - True if the transition is permitted, false otherwise.
   */
  isValidTransition(
    current: OrderStatus,
    target: OrderStatus,
  ): boolean {
    // Define the state machine for order transitions
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_STOCK]: [
        OrderStatus.PAYMENT_PENDING, 
        OrderStatus.STOCK_FAILED, 
        OrderStatus.CANCELLED
      ],
      [OrderStatus.PENDING]: [
        OrderStatus.PAID, 
        OrderStatus.CANCELLED
      ],
      [OrderStatus.PAYMENT_PENDING]: [
        OrderStatus.PAID, 
        OrderStatus.CANCELLED
      ],
      [OrderStatus.STOCK_CONFIRMED]: [
        OrderStatus.PAID, 
        OrderStatus.CANCELLED
      ],
      [OrderStatus.STOCK_FAILED]: [],
      [OrderStatus.PAID]: [
        OrderStatus.APPROVED, 
        OrderStatus.REJECTED
      ],
      [OrderStatus.APPROVED]: [
        OrderStatus.PROCESSING
      ],
      [OrderStatus.PROCESSING]: [
        OrderStatus.SHIPPED
      ],
      [OrderStatus.SHIPPED]: [
        OrderStatus.DELIVERED
      ],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.REJECTED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    // Check if the target status is in the list of allowed next states
    return allowed[current]?.includes(target) ?? false;
  }
}

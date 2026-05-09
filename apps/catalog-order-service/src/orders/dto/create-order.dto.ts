/**
 * Shipping address shape sent from the client at checkout time.
 * Stored as a JSONB snapshot in the orders table so the record
 * is preserved even if the user later edits or deletes the address.
 */
export interface ShippingAddressSnapshot {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export class CreateOrderDto {
  items: {
    productId: string;
    quantity: number;
  }[];

  /**
   * Logical reference ID of the address saved in user-service (optional).
   * Used for display / history but the full snapshot is what we store.
   */
  shippingAddressId?: string;

  /**
   * Full address captured by the frontend at checkout time.
   * Sent by the client so no cross-service HTTP call is needed during the transaction.
   */
  shippingAddressSnapshot?: ShippingAddressSnapshot;

  /**
   * Internal User ID (UUID) provided by the client as a fallback if the JWT metadata is stale.
   */
  userId?: string;
}


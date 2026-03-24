export class CreateOrderDto {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddressId?: string;
}

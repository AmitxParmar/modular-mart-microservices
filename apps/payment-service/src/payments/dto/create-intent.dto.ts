export class CreateIntentDto {
  orderId: string;
  amount: number; // Payment service no longer fetches order — caller provides amount
}

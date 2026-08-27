export interface NotificationPort {
  sendOrderConfirmation(customerId: string, orderId: string, total: number): Promise<void>;
}

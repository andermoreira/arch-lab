export interface PaymentGatewayPort {
  authorize(amount: number, creditCardToken: string): Promise<{ success: boolean; transactionId?: string; error?: string }>;
  refund(transactionId: string): Promise<boolean>;
}

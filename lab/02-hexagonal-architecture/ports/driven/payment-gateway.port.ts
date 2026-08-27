export interface PaymentResult {
  success: boolean;
  transactionId: string;
  errorMessage?: string;
}

export interface PaymentGatewayPort {
  charge(amount: number, paymentToken: string): Promise<PaymentResult>;
}

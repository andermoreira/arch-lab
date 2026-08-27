import type { PaymentGatewayPort, PaymentResult } from '../ports/driven/payment-gateway.port.js';

export class MockPaymentGatewayAdapter implements PaymentGatewayPort {
  constructor(private readonly shouldSucceed: boolean = true) {}

  public async charge(amount: number, paymentToken: string): Promise<PaymentResult> {
    if (!this.shouldSucceed || paymentToken === 'invalid-card') {
      return {
        success: false,
        transactionId: '',
        errorMessage: 'Card declined / Insufficient funds',
      };
    }

    return {
      success: true,
      transactionId: `tx_${Math.random().toString(36).substring(2, 9)}`,
    };
  }
}

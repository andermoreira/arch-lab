import type { PaymentGatewayPort } from '../ports/payment-gateway.port.js';

export class MockEnterprisePaymentAdapter implements PaymentGatewayPort {
  public refundedTransactions: string[] = [];

  public async authorize(
    amount: number,
    creditCardToken: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (creditCardToken.includes('DECLINE') || amount > 10000) {
      return { success: false, error: 'Credit card declined / Limit exceeded' };
    }
    return {
      success: true,
      transactionId: `auth_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  public async refund(transactionId: string): Promise<boolean> {
    this.refundedTransactions.push(transactionId);
    return true;
  }
}

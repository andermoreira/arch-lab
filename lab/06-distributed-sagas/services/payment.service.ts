export interface PaymentOutcome {
  success: boolean;
  transactionId?: string;
  reason?: string;
}

export class PaymentService {
  private readonly refundedTransactions: string[] = [];

  public async charge(amount: number, cardNumber: string): Promise<PaymentOutcome> {
    if (cardNumber.startsWith('4000_DECLINE') || amount <= 0) {
      return { success: false, reason: 'Card declined or invalid amount' };
    }

    return {
      success: true,
      transactionId: `tx_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  // Compensating Transaction
  public async refund(transactionId: string): Promise<void> {
    this.refundedTransactions.push(transactionId);
  }

  public wasRefunded(transactionId: string): boolean {
    return this.refundedTransactions.includes(transactionId);
  }
}

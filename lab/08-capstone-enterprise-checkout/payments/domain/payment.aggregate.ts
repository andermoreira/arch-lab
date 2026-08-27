export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'REFUNDED' | 'FAILED';

export class PaymentAggregate {
  private _status: PaymentStatus = 'PENDING';
  private _transactionId?: string;

  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly amount: number
  ) {
    if (amount <= 0) throw new Error('Payment amount must be positive');
  }

  public get status(): PaymentStatus {
    return this._status;
  }

  public get transactionId(): string | undefined {
    return this._transactionId;
  }

  public authorize(transactionId: string): void {
    this._status = 'AUTHORIZED';
    this._transactionId = transactionId;
  }

  public refund(): void {
    if (this._status !== 'AUTHORIZED') {
      throw new Error('Can only refund an authorized payment');
    }
    this._status = 'REFUNDED';
  }

  public fail(): void {
    this._status = 'FAILED';
  }
}

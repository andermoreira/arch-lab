export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export class OrderAggregate {
  private _status: OrderStatus = 'DRAFT';

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly sku: string,
    public readonly quantity: number,
    public readonly unitPrice: number
  ) {
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (unitPrice <= 0) throw new Error('Unit price must be positive');
  }

  public get status(): OrderStatus {
    return this._status;
  }

  public get totalAmount(): number {
    return this.quantity * this.unitPrice;
  }

  public confirm(): void {
    if (this._status !== 'DRAFT') {
      throw new Error(`Cannot confirm order in state "${this._status}"`);
    }
    this._status = 'CONFIRMED';
  }

  public cancel(): void {
    this._status = 'CANCELLED';
  }
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';

export interface OrderItem {
  sku: string;
  unitPrice: number;
  quantity: number;
}

export class Order {
  private _status: OrderStatus;

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: OrderItem[],
    initialStatus: OrderStatus = 'PENDING'
  ) {
    if (items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    for (const item of items) {
      if (item.quantity <= 0) throw new Error('Item quantity must be greater than zero');
      if (item.unitPrice < 0) throw new Error('Item unit price cannot be negative');
    }
    this._status = initialStatus;
  }

  public get status(): OrderStatus {
    return this._status;
  }

  public calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  public markAsPaid(): void {
    if (this._status !== 'PENDING') {
      throw new Error(`Cannot pay an order with status "${this._status}"`);
    }
    this._status = 'PAID';
  }

  public cancel(): void {
    if (this._status === 'SHIPPED') {
      throw new Error('Cannot cancel an already shipped order');
    }
    this._status = 'CANCELLED';
  }
}

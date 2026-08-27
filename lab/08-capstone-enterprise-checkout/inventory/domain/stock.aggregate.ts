export class StockAggregate {
  constructor(
    public readonly sku: string,
    private _availableQuantity: number
  ) {
    if (_availableQuantity < 0) throw new Error('Quantity cannot be negative');
  }

  public get availableQuantity(): number {
    return this._availableQuantity;
  }

  public reserve(quantity: number): void {
    if (quantity <= 0) throw new Error('Reserve quantity must be positive');
    if (this._availableQuantity < quantity) {
      throw new Error(`Insufficient stock for ${this.sku}. Available: ${this._availableQuantity}, Requested: ${quantity}`);
    }
    this._availableQuantity -= quantity;
  }

  // Compensation
  public release(quantity: number): void {
    this._availableQuantity += quantity;
  }
}

export class InventoryService {
  private readonly stock = new Map<string, number>();

  constructor(initialStock: Record<string, number> = {}) {
    for (const [sku, qty] of Object.entries(initialStock)) {
      this.stock.set(sku, qty);
    }
  }

  public async reserve(sku: string, quantity: number): Promise<boolean> {
    const current = this.stock.get(sku) || 0;
    if (current < quantity) {
      return false;
    }
    this.stock.set(sku, current - quantity);
    return true;
  }

  // Compensating Transaction
  public async release(sku: string, quantity: number): Promise<void> {
    const current = this.stock.get(sku) || 0;
    this.stock.set(sku, current + quantity);
  }

  public getStock(sku: string): number {
    return this.stock.get(sku) || 0;
  }
}

import type { StockAggregate } from '../domain/stock.aggregate.js';
import type { InventoryRepositoryPort } from '../ports/inventory.repository.port.js';

export class InMemoryInventoryRepository implements InventoryRepositoryPort {
  private readonly store = new Map<string, StockAggregate>();

  public async save(stock: StockAggregate): Promise<void> {
    this.store.set(stock.sku, stock);
  }

  public async findBySku(sku: string): Promise<StockAggregate | null> {
    return this.store.get(sku) || null;
  }
}

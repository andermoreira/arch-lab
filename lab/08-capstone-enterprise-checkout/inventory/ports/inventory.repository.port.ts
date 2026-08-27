import type { StockAggregate } from '../domain/stock.aggregate.js';

export interface InventoryRepositoryPort {
  save(stock: StockAggregate): Promise<void>;
  findBySku(sku: string): Promise<StockAggregate | null>;
}

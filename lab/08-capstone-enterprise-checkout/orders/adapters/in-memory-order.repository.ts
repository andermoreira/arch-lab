import type { OrderAggregate } from '../domain/order.aggregate.js';
import type { OrderRepositoryPort } from '../ports/order.repository.port.js';

export class InMemoryOrderRepository implements OrderRepositoryPort {
  private readonly store = new Map<string, OrderAggregate>();

  public async save(order: OrderAggregate): Promise<void> {
    this.store.set(order.id, order);
  }

  public async findById(id: string): Promise<OrderAggregate | null> {
    return this.store.get(id) || null;
  }
}

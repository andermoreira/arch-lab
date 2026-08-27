import { Order } from '../domain/order.js';
import type { OrderRepositoryPort } from '../ports/driven/order-repository.port.js';

export class InMemoryOrderRepository implements OrderRepositoryPort {
  private readonly store = new Map<string, Order>();

  public async save(order: Order): Promise<void> {
    this.store.set(order.id, order);
  }

  public async findById(id: string): Promise<Order | null> {
    return this.store.get(id) || null;
  }

  public count(): number {
    return this.store.size;
  }
}

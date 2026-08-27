import type { OrderAggregate } from '../domain/order.aggregate.js';

export interface OrderRepositoryPort {
  save(order: OrderAggregate): Promise<void>;
  findById(id: string): Promise<OrderAggregate | null>;
}

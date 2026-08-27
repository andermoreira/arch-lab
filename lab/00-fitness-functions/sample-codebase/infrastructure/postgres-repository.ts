import { Pool } from 'pg';
import { CleanOrder } from '../clean-domain/order.js';

export class PostgresOrderRepository {
  constructor(private readonly pool: Pool) {}

  public async save(order: CleanOrder): Promise<void> {
    await this.pool.query('INSERT INTO orders (id, amount) VALUES ($1, $2)', [order.id, order.amount]);
  }
}

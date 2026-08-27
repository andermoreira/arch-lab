// Tainted Domain Entity - VIOLATION: Directly imports DB driver inside domain
import { Pool } from 'pg';

export class CorruptedOrder {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    private readonly dbPool: Pool
  ) {}

  public async saveDirectlyToDatabase(): Promise<void> {
    await this.dbPool.query('INSERT INTO orders VALUES ($1, $2)', [this.id, this.amount]);
  }
}

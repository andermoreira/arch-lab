export interface OutboxRecord {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  createdAt: Date;
  publishedAt?: Date;
  retryCount: number;
}

export class TransactionalDatabase {
  private readonly orders = new Map<string, { id: string; amount: number; status: string }>();
  private readonly outbox = new Map<string, OutboxRecord>();

  /**
   * Simulates an atomic SQL transaction:
   * BEGIN;
   * INSERT INTO orders ...;
   * INSERT INTO outbox_messages ...;
   * COMMIT;
   */
  public async executeAtomicOrderPlacement(
    order: { id: string; amount: number; status: string },
    outboxEvent: { topic: string; payload: Record<string, unknown> }
  ): Promise<string> {
    const outboxId = `out_${Math.random().toString(36).substring(2, 9)}`;

    // Both saved in the same memory commit
    this.orders.set(order.id, order);
    this.outbox.set(outboxId, {
      id: outboxId,
      topic: outboxEvent.topic,
      payload: outboxEvent.payload,
      status: 'PENDING',
      createdAt: new Date(),
      retryCount: 0,
    });

    return outboxId;
  }

  public getPendingOutboxMessages(): OutboxRecord[] {
    return Array.from(this.outbox.values()).filter((r) => r.status === 'PENDING');
  }

  public markOutboxPublished(id: string): void {
    const record = this.outbox.get(id);
    if (record) {
      record.status = 'PUBLISHED';
      record.publishedAt = new Date();
    }
  }

  public markOutboxFailed(id: string): void {
    const record = this.outbox.get(id);
    if (record) {
      record.retryCount += 1;
      if (record.retryCount >= 3) {
        record.status = 'FAILED';
      }
    }
  }

  public getOrder(id: string) {
    return this.orders.get(id) || null;
  }

  public getOutboxRecord(id: string): OutboxRecord | null {
    return this.outbox.get(id) || null;
  }
}

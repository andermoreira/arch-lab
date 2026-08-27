import type { TransactionalDatabase } from './outbox-database.js';
import type { MockMessageBroker } from './message-broker.js';

export class OutboxRelayWorker {
  constructor(
    private readonly db: TransactionalDatabase,
    private readonly broker: MockMessageBroker
  ) {}

  /**
   * Processes all pending outbox records and attempts to publish to broker.
   */
  public async processPendingMessages(): Promise<{ successCount: number; failedCount: number }> {
    const pending = this.db.getPendingOutboxMessages();
    let successCount = 0;
    let failedCount = 0;

    for (const record of pending) {
      try {
        await this.broker.publish(record.topic, record.id, record.payload);
        this.db.markOutboxPublished(record.id);
        successCount += 1;
      } catch {
        this.db.markOutboxFailed(record.id);
        failedCount += 1;
      }
    }

    return { successCount, failedCount };
  }
}

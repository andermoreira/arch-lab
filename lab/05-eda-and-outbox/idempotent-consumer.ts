import type { BrokerMessage } from './message-broker.js';

export class IdempotentConsumer {
  private readonly processedMessageIds = new Set<string>();
  public processedCount: number = 0;
  public skippedDuplicatesCount: number = 0;

  public async handleMessage(message: BrokerMessage): Promise<void> {
    // 1. Idempotency Check
    if (this.processedMessageIds.has(message.messageId)) {
      this.skippedDuplicatesCount += 1;
      return; // Skip side effects
    }

    // 2. Perform business side-effect
    this.processedCount += 1;

    // 3. Mark message as processed atomically
    this.processedMessageIds.add(message.messageId);
  }
}

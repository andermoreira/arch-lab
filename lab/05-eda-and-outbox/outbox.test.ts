import { describe, it, expect } from 'vitest';
import { TransactionalDatabase } from './outbox-database.js';
import { MockMessageBroker } from './message-broker.js';
import { OutboxRelayWorker } from './outbox-relay.js';
import { IdempotentConsumer } from './idempotent-consumer.js';

describe('Fase 5: EDA & Transactional Outbox Pattern (Eliminating Dual-Write)', () => {
  it('should prove Dual-Write data loss when broker fails during immediate dispatch', async () => {
    const db = new TransactionalDatabase();
    const broker = new MockMessageBroker();
    broker.isHealthy = false; // Network split / broker down

    let messageSent = false;
    let orderCommitted = false;

    // Naive Dual-Write attempt:
    try {
      // 1. Commit in DB
      await db.executeAtomicOrderPlacement(
        { id: 'ord_fail_01', amount: 100, status: 'PAID' },
        { topic: 'orders', payload: {} }
      );
      orderCommitted = true;

      // 2. Direct network call to broker (Dual-Write)
      await broker.publish('orders', 'msg_01', { orderId: 'ord_fail_01' });
      messageSent = true;
    } catch {
      // Caught broker failure
    }

    // Phenomenon: Order was saved in DB, but message was lost forever!
    expect(orderCommitted).toBe(true);
    expect(messageSent).toBe(false);
    expect(broker.publishedMessages).toHaveLength(0);
  });

  it('should guarantee zero message loss with Transactional Outbox and Idempotent Consumer', async () => {
    const db = new TransactionalDatabase();
    const broker = new MockMessageBroker();
    const relay = new OutboxRelayWorker(db, broker);
    const consumer = new IdempotentConsumer();

    broker.subscribe('orders', (msg) => consumer.handleMessage(msg));

    // Step 1: Save Order + Outbox in atomic transaction while broker is DOWN
    broker.isHealthy = false;
    const outboxId = await db.executeAtomicOrderPlacement(
      { id: 'ord_success_99', amount: 450, status: 'PAID' },
      { topic: 'orders', payload: { orderId: 'ord_success_99', amount: 450 } }
    );

    // Relay tries to process but fails safely
    const run1 = await relay.processPendingMessages();
    expect(run1.failedCount).toBe(1);
    expect(db.getOutboxRecord(outboxId)?.status).toBe('PENDING');

    // Step 2: Broker recovers, next relay poll succeeds
    broker.isHealthy = true;
    const run2 = await relay.processPendingMessages();
    expect(run2.successCount).toBe(1);
    expect(db.getOutboxRecord(outboxId)?.status).toBe('PUBLISHED');
    expect(consumer.processedCount).toBe(1);

    // Step 3: Simulate duplicate delivery (At-Least-Once retry)
    await broker.publish('orders', outboxId, { orderId: 'ord_success_99' });
    expect(consumer.processedCount).toBe(1); // Not executed again
    expect(consumer.skippedDuplicatesCount).toBe(1); // Safely skipped
  });
});

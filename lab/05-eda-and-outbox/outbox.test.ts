import { describe, it, expect } from 'vitest';
import { TransactionalDatabase } from './outbox-database.js';
import { MockMessageBroker } from './message-broker.js';
import { OutboxRelayWorker } from './outbox-relay.js';
import { IdempotentConsumer, InMemoryProcessedMessageStore } from './idempotent-consumer.js';

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

  it('should roll back the order when the outbox insert fails (true atomicity, no orphan order)', async () => {
    const db = new TransactionalDatabase();

    // Simula o segundo INSERT (outbox) falhando dentro da mesma transação.
    db.failOutboxInsert = () => {
      throw new Error('outbox INSERT failed: unique constraint violation');
    };

    await expect(
      db.executeAtomicOrderPlacement(
        { id: 'ord_atomic_01', amount: 250, status: 'PAID' },
        { topic: 'orders', payload: { orderId: 'ord_atomic_01' } }
      )
    ).rejects.toThrow('outbox INSERT failed');

    // Atomicidade: como o outbox não pôde ser gravado, o pedido também não
    // ficou persistido. NÃO há pedido órfão sem evento (o mal do dual-write).
    expect(db.getOrder('ord_atomic_01')).toBeNull();
    expect(db.getPendingOutboxMessages()).toHaveLength(0);
  });

  it('should move a message to the FAILED dead-letter state after exhausting retries', async () => {
    const db = new TransactionalDatabase();
    const broker = new MockMessageBroker();
    const relay = new OutboxRelayWorker(db, broker);

    const outboxId = await db.executeAtomicOrderPlacement(
      { id: 'ord_dead_letter', amount: 999, status: 'PAID' },
      { topic: 'orders', payload: { orderId: 'ord_dead_letter' } }
    );

    // Broker permanece fora do ar em todas as tentativas do relay.
    broker.isHealthy = false;

    // Retry 1 e 2: continua PENDING (será repolado).
    await relay.processPendingMessages();
    expect(db.getOutboxRecord(outboxId)?.status).toBe('PENDING');
    expect(db.getOutboxRecord(outboxId)?.retryCount).toBe(1);

    await relay.processPendingMessages();
    expect(db.getOutboxRecord(outboxId)?.status).toBe('PENDING');
    expect(db.getOutboxRecord(outboxId)?.retryCount).toBe(2);

    // Retry 3: esgota as tentativas -> vai para o estado terminal FAILED.
    await relay.processPendingMessages();
    expect(db.getOutboxRecord(outboxId)?.retryCount).toBe(3);
    expect(db.getOutboxRecord(outboxId)?.status).toBe('FAILED');

    // Uma vez FAILED, o relay não o repola mais (saiu de PENDING).
    expect(db.getPendingOutboxMessages()).toHaveLength(0);
  });

  it('should stay idempotent across a consumer crash because processed ids are persisted outside the process', async () => {
    const broker = new MockMessageBroker();
    // Store persistido "fora do processo" (representa a tabela processed_messages).
    const durableStore = new InMemoryProcessedMessageStore();

    // Consumidor v1 processa a mensagem e persiste o id no store durável.
    const consumerV1 = new IdempotentConsumer(durableStore);
    broker.subscribe('orders', (msg) => consumerV1.handleMessage(msg));
    await broker.publish('orders', 'msg_crash_01', { orderId: 'ord_crash' });
    expect(consumerV1.processedCount).toBe(1);

    // --- CRASH --- o processo cai e volta como uma instância nova (contadores
    // zerados), mas apontando para o MESMO store durável.
    const consumerV2 = new IdempotentConsumer(durableStore);

    // Redistribuição at-least-once da mesma mensagem após o restart.
    await consumerV2.handleMessage({
      messageId: 'msg_crash_01',
      topic: 'orders',
      payload: { orderId: 'ord_crash' },
      publishedAt: new Date(),
    });

    // O efeito de negócio NÃO é reaplicado: a marca sobreviveu ao crash.
    expect(consumerV2.processedCount).toBe(0);
    expect(consumerV2.skippedDuplicatesCount).toBe(1);
  });
});

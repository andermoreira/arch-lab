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
   * Hook de injeção de falha para fins didáticos: simula o INSERT na tabela de
   * outbox estourando (constraint, disco cheio, deadlock). Quando definido, é
   * chamado DEPOIS do INSERT do pedido e ANTES do COMMIT, forçando o rollback.
   */
  public failOutboxInsert: (() => void) | null = null;

  /**
   * Simula uma transação SQL atômica:
   * BEGIN;
   * INSERT INTO orders ...;
   * INSERT INTO outbox_messages ...;
   * COMMIT;
   *
   * O ponto central do Transactional Outbox é que o pedido e o evento de outbox
   * são gravados na MESMA transação: ou os dois entram, ou nenhum. Aqui provamos
   * isso de fato — se o insert do outbox falhar, desfazemos o insert do pedido
   * (rollback), em vez de deixar um pedido órfão sem evento (o problema clássico
   * do dual-write).
   */
  public async executeAtomicOrderPlacement(
    order: { id: string; amount: number; status: string },
    outboxEvent: { topic: string; payload: Record<string, unknown> }
  ): Promise<string> {
    const outboxId = `out_${Math.random().toString(36).substring(2, 9)}`;
    const orderExistedBefore = this.orders.has(order.id);

    // BEGIN
    this.orders.set(order.id, order);

    try {
      // Simula uma falha no segundo INSERT da mesma transação.
      if (this.failOutboxInsert) {
        this.failOutboxInsert();
      }

      this.outbox.set(outboxId, {
        id: outboxId,
        topic: outboxEvent.topic,
        payload: outboxEvent.payload,
        status: 'PENDING',
        createdAt: new Date(),
        retryCount: 0,
      });
    } catch (error) {
      // ROLLBACK: nada foi comitado. O pedido também é desfeito.
      if (!orderExistedBefore) {
        this.orders.delete(order.id);
      }
      throw error;
    }

    // COMMIT
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

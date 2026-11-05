import type { EnterpriseOutbox } from './enterprise-outbox.js';

/** Broker de mensagens do capstone (mock), com toggle de saúde para testes. */
export interface EnterpriseEventBroker {
  publish(context: string, eventName: string, payload: Record<string, unknown>): Promise<void>;
}

export class MockEnterpriseEventBroker implements EnterpriseEventBroker {
  public isHealthy = true;
  public readonly published: Array<{ context: string; eventName: string; payload: Record<string, unknown> }> = [];

  public async publish(context: string, eventName: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.isHealthy) {
      throw new Error('Event broker unavailable (network partition)');
    }
    this.published.push({ context, eventName, payload });
  }
}

/**
 * Relay (Message Relay / Polling Publisher) do Transactional Outbox.
 *
 * Lê os eventos PENDING do outbox e tenta publicá-los no broker. Só marca como
 * PUBLISHED após o publish ter sucesso. Se o broker estiver fora do ar, o evento
 * permanece PENDING e será republicado numa próxima passada — entrega garantida
 * (at-least-once), sem perder eventos e sem dual-write.
 */
export class EnterpriseOutboxRelay {
  constructor(
    private readonly outbox: EnterpriseOutbox,
    private readonly broker: EnterpriseEventBroker
  ) {}

  public async publishPending(): Promise<{ publishedCount: number; failedCount: number }> {
    let publishedCount = 0;
    let failedCount = 0;

    for (const record of this.outbox.getPending()) {
      try {
        await this.broker.publish(record.context, record.eventName, record.payload);
        this.outbox.markPublished(record.id);
        publishedCount += 1;
      } catch {
        // Mantém PENDING para reprocessar depois.
        failedCount += 1;
      }
    }

    return { publishedCount, failedCount };
  }
}

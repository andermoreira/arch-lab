export type EnterpriseOutboxStatus = 'PENDING' | 'PUBLISHED';

export interface EnterpriseOutboxRecord {
  id: string;
  context: string;
  eventName: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  status: EnterpriseOutboxStatus;
  publishedAt?: Date;
}

/**
 * Transactional Outbox do capstone.
 *
 * Antes isto era só um log de auditoria (append em array). Agora é um outbox de
 * verdade, no espírito da Fase 05: cada evento nasce PENDING, gravado na mesma
 * "transação" das mudanças de estado do negócio (aqui, na mesma chamada da saga).
 * Um relay separado (EnterpriseOutboxRelay) publica os pendentes num broker e só
 * então marca como PUBLISHED — eliminando o dual-write (nunca há efeito de
 * negócio comitado sem o evento correspondente aguardando publicação garantida).
 *
 * A API `logEvent`/`records` foi mantida para compatibilidade com o restante do
 * capstone; a novidade é o ciclo de vida PENDING -> PUBLISHED e o relay.
 */
export class EnterpriseOutbox {
  public readonly records: EnterpriseOutboxRecord[] = [];

  /** Grava um evento PENDING (parte da transação de negócio). */
  public logEvent(context: string, eventName: string, payload: Record<string, unknown>): EnterpriseOutboxRecord {
    const record: EnterpriseOutboxRecord = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      context,
      eventName,
      payload,
      timestamp: new Date(),
      status: 'PENDING',
    };
    this.records.push(record);
    return record;
  }

  /** Eventos ainda não publicados no broker (na ordem em que foram gravados). */
  public getPending(): EnterpriseOutboxRecord[] {
    return this.records.filter((r) => r.status === 'PENDING');
  }

  public markPublished(id: string): void {
    const record = this.records.find((r) => r.id === id);
    if (record) {
      record.status = 'PUBLISHED';
      record.publishedAt = new Date();
    }
  }
}

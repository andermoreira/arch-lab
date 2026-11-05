import type { DomainEvent } from './order-placed.event.js';

/**
 * Evento de domínio emitido quando um pedido é cancelado. Simetria com
 * OrderPlacedEvent: toda mudança de estado relevante do agregado emite um evento
 * (é a base para EDA/Event Sourcing das fases seguintes).
 */
export class OrderCancelledEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'OrderCancelled';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly reason: string
  ) {
    this.eventId = `evt_${Math.random().toString(36).substring(2, 9)}`;
    this.occurredAt = new Date();
    Object.freeze(this);
  }
}

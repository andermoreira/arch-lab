import { Money } from '../value-objects/money.vo.js';

export interface DomainEvent {
  eventId: string;
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
}

export class OrderPlacedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'OrderPlaced';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly customerEmail: string,
    public readonly total: Money,
    public readonly itemCount: number
  ) {
    this.eventId = `evt_${Math.random().toString(36).substring(2, 9)}`;
    this.occurredAt = new Date();
    Object.freeze(this);
  }
}

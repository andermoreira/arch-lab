import { Money } from '../value-objects/money.vo.js';
import { EmailAddress } from '../value-objects/email.vo.js';
import { Sku } from '../value-objects/sku.vo.js';
import { OrderPlacedEvent, type DomainEvent } from '../events/order-placed.event.js';

export interface OrderLineItem {
  sku: Sku;
  unitPrice: Money;
  quantity: number;
}

export type OrderState = 'DRAFT' | 'PLACED' | 'CANCELLED';

export class OrderAggregate {
  private readonly _items: OrderLineItem[] = [];
  private _state: OrderState = 'DRAFT';
  private readonly _domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly customerEmail: EmailAddress,
    public readonly currency: string = 'BRL'
  ) {}

  public get state(): OrderState {
    return this._state;
  }

  public get items(): readonly OrderLineItem[] {
    return [...this._items];
  }

  public get domainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  public addItem(sku: Sku, unitPrice: Money, quantity: number): void {
    if (this._state !== 'DRAFT') {
      throw new Error(`Cannot add items to an order in state "${this._state}"`);
    }
    if (quantity <= 0) {
      throw new Error(`Item quantity must be greater than zero. Provided: ${quantity}`);
    }
    if (unitPrice.currency !== this.currency) {
      throw new Error(`Currency mismatch. Order is in ${this.currency}, item is in ${unitPrice.currency}`);
    }

    this._items.push({ sku, unitPrice, quantity });
  }

  public calculateTotal(): Money {
    return this._items.reduce(
      (total, item) => total.add(item.unitPrice.multiply(item.quantity)),
      Money.zero(this.currency)
    );
  }

  public place(): void {
    if (this._state !== 'DRAFT') {
      throw new Error(`Cannot place order in state "${this._state}"`);
    }
    if (this._items.length === 0) {
      throw new Error('Cannot place an empty order with zero items');
    }

    this._state = 'PLACED';
    const total = this.calculateTotal();

    // Emit domain event
    this._domainEvents.push(
      new OrderPlacedEvent(this.id, this.customerEmail.value, total, this._items.length)
    );
  }

  public cancel(): void {
    if (this._state === 'CANCELLED') {
      throw new Error('Order is already cancelled');
    }
    this._state = 'CANCELLED';
  }
}

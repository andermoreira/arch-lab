import type {
  StoredEvent,
  AccountOpenedPayload,
  MoneyDepositedPayload,
  MoneyWithdrawnPayload,
} from './events.js';

export class BankAccountAggregate {
  private _id: string = '';
  private _holder: string = '';
  private _balance: number = 0;
  private _version: number = 0;
  private readonly _uncommittedEvents: StoredEvent[] = [];

  public get id(): string {
    return this._id;
  }

  public get holder(): string {
    return this._holder;
  }

  public get balance(): number {
    return this._balance;
  }

  public get version(): number {
    return this._version;
  }

  public get uncommittedEvents(): StoredEvent[] {
    return [...this._uncommittedEvents];
  }

  public clearUncommittedEvents(): void {
    this._uncommittedEvents.length = 0;
  }

  // --- Commands ---

  public static open(id: string, holder: string, initialDeposit: number): BankAccountAggregate {
    if (!id || !holder) throw new Error('Account ID and holder are required');
    if (initialDeposit < 0) throw new Error('Initial deposit cannot be negative');

    const account = new BankAccountAggregate();
    account.recordEvent('AccountOpened', {
      holder,
      initialBalance: initialDeposit,
    }, id);
    return account;
  }

  public deposit(amount: number, description: string = 'Deposit'): void {
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    this.recordEvent('MoneyDeposited', { amount, description });
  }

  public withdraw(amount: number, description: string = 'Withdrawal'): void {
    if (amount <= 0) throw new Error('Withdrawal amount must be positive');
    if (this._balance < amount) {
      throw new Error(`Insufficient funds: cannot withdraw ${amount} from balance ${this._balance}`);
    }
    this.recordEvent('MoneyWithdrawn', { amount, description });
  }

  // --- Event Application & Replay ---

  private recordEvent(eventType: string, payload: Record<string, unknown>, targetId?: string): void {
    const nextVersion = this._version + 1;
    const event: StoredEvent = {
      eventId: `evt_${Math.random().toString(36).substring(2, 9)}`,
      streamId: targetId || this._id,
      version: nextVersion,
      eventType,
      payload,
      timestamp: new Date(),
    };

    this.applyEvent(event);
    this._uncommittedEvents.push(event);
  }

  public applyEvent(event: StoredEvent): void {
    switch (event.eventType) {
      case 'AccountOpened': {
        const p = event.payload as unknown as AccountOpenedPayload;
        this._id = event.streamId;
        this._holder = p.holder;
        this._balance = p.initialBalance;
        break;
      }
      case 'MoneyDeposited': {
        const p = event.payload as unknown as MoneyDepositedPayload;
        this._balance += p.amount;
        break;
      }
      case 'MoneyWithdrawn': {
        const p = event.payload as unknown as MoneyWithdrawnPayload;
        this._balance -= p.amount;
        break;
      }
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
    this._version = event.version;
  }

  public static replayFromHistory(events: StoredEvent[]): BankAccountAggregate {
    const account = new BankAccountAggregate();
    for (const event of events) {
      account.applyEvent(event);
    }
    return account;
  }
}

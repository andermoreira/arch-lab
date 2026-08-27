import type {
  StoredEvent,
  AccountOpenedPayload,
  MoneyDepositedPayload,
  MoneyWithdrawnPayload,
} from '../domain/events.js';

export interface AccountSummaryView {
  accountId: string;
  holder: string;
  currentBalance: number;
  totalTransactions: number;
  lastUpdated: Date;
}

export class AccountBalanceProjection {
  private readonly views = new Map<string, AccountSummaryView>();

  public handle(event: StoredEvent): void {
    const existing = this.views.get(event.streamId);

    switch (event.eventType) {
      case 'AccountOpened': {
        const p = event.payload as unknown as AccountOpenedPayload;
        this.views.set(event.streamId, {
          accountId: event.streamId,
          holder: p.holder,
          currentBalance: p.initialBalance,
          totalTransactions: 0,
          lastUpdated: event.timestamp,
        });
        break;
      }
      case 'MoneyDeposited': {
        const p = event.payload as unknown as MoneyDepositedPayload;
        if (existing) {
          existing.currentBalance += p.amount;
          existing.totalTransactions += 1;
          existing.lastUpdated = event.timestamp;
        }
        break;
      }
      case 'MoneyWithdrawn': {
        const p = event.payload as unknown as MoneyWithdrawnPayload;
        if (existing) {
          existing.currentBalance -= p.amount;
          existing.totalTransactions += 1;
          existing.lastUpdated = event.timestamp;
        }
        break;
      }
    }
  }

  public getById(accountId: string): AccountSummaryView | null {
    return this.views.get(accountId) || null;
  }
}

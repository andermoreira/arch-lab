export interface StoredEvent {
  eventId: string;
  streamId: string;
  version: number;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface AccountOpenedPayload {
  holder: string;
  initialBalance: number;
}

export interface MoneyDepositedPayload {
  amount: number;
  description: string;
}

export interface MoneyWithdrawnPayload {
  amount: number;
  description: string;
}

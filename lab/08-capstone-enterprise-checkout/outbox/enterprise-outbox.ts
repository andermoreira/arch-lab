export interface EnterpriseOutboxRecord {
  id: string;
  context: string;
  eventName: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export class EnterpriseOutbox {
  public readonly records: EnterpriseOutboxRecord[] = [];

  public logEvent(context: string, eventName: string, payload: Record<string, unknown>): void {
    this.records.push({
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      context,
      eventName,
      payload,
      timestamp: new Date(),
    });
  }
}

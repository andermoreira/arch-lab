import type { StoredEvent } from '../domain/events.js';

export class ConcurrencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export class InMemoryEventStore {
  private readonly streams = new Map<string, StoredEvent[]>();
  private readonly listeners: Array<(event: StoredEvent) => void> = [];

  public subscribe(listener: (event: StoredEvent) => void): void {
    this.listeners.push(listener);
  }

  public async getEventsForStream(streamId: string): Promise<StoredEvent[]> {
    return [...(this.streams.get(streamId) || [])];
  }

  public async append(streamId: string, events: StoredEvent[], expectedVersion: number): Promise<void> {
    const existing = this.streams.get(streamId) || [];
    const currentVersion = existing.length > 0 ? existing[existing.length - 1].version : 0;

    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyConflictError(
        `Optimistic Concurrency Conflict on stream "${streamId}". Expected version ${expectedVersion}, but found ${currentVersion}.`
      );
    }

    const updated = existing.concat(events);
    this.streams.set(streamId, updated);

    // Notify projections
    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event);
      }
    }
  }

  public get totalEventsCount(): number {
    let count = 0;
    for (const events of this.streams.values()) {
      count += events.length;
    }
    return count;
  }
}

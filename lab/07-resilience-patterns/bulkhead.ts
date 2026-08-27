export class BulkheadFullError extends Error {
  constructor(message: string = 'Bulkhead capacity reached. Request rejected.') {
    super(message);
    this.name = 'BulkheadFullError';
  }
}

export class BulkheadIsolation {
  private activeExecutions: number = 0;

  constructor(public readonly maxConcurrent: number) {
    if (maxConcurrent <= 0) throw new Error('maxConcurrent must be positive');
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.activeExecutions >= this.maxConcurrent) {
      throw new BulkheadFullError();
    }

    this.activeExecutions += 1;
    try {
      return await action();
    } finally {
      this.activeExecutions -= 1;
    }
  }

  public get currentLoad(): number {
    return this.activeExecutions;
  }
}

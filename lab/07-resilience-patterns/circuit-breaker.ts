export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number; // Consecutive failures to open circuit
  cooldownPeriodMs: number; // Time in OPEN state before trying HALF_OPEN
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string = 'Circuit Breaker is OPEN. Call rejected fast.') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private _state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastStateChangeTimestamp: number = Date.now();

  constructor(private readonly options: CircuitBreakerOptions) {}

  public get state(): CircuitState {
    this.checkCooldownTransition();
    return this._state;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    this.checkCooldownTransition();

    if (this._state === 'OPEN') {
      throw new CircuitBreakerOpenError();
    }

    try {
      const result = await action();
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }

  private handleSuccess(): void {
    if (this._state === 'HALF_OPEN') {
      this._state = 'CLOSED';
      this.failureCount = 0;
    }
    this.failureCount = 0;
  }

  private handleFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= this.options.failureThreshold || this._state === 'HALF_OPEN') {
      this._state = 'OPEN';
      this.lastStateChangeTimestamp = Date.now();
    }
  }

  private checkCooldownTransition(): void {
    if (this._state === 'OPEN') {
      const elapsed = Date.now() - this.lastStateChangeTimestamp;
      if (elapsed >= this.options.cooldownPeriodMs) {
        this._state = 'HALF_OPEN';
        this.lastStateChangeTimestamp = Date.now();
      }
    }
  }
}

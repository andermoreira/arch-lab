import { describe, it, expect, vi, afterEach } from 'vitest';
import { CircuitBreaker, CircuitBreakerOpenError } from './circuit-breaker.js';
import { retryWithBackoff, RetryExhaustedError } from './retry-with-backoff.js';
import { BulkheadIsolation, BulkheadFullError } from './bulkhead.js';
import { SingleFlightCache } from './single-flight-cache.js';

describe('Fase 7: Resilience & Distributed Patterns (Circuit Breaker, Bulkhead, Cache Stampede)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Circuit Breaker', () => {
    it('should transition from CLOSED to OPEN after consecutive failures and fail fast', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownPeriodMs: 100 });

      const failingCall = () => Promise.reject(new Error('Downstream service 500 error'));

      // Fail 1
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      expect(breaker.state).toBe('CLOSED');

      // Fail 2
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      expect(breaker.state).toBe('CLOSED');

      // Fail 3 -> Trips to OPEN
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      expect(breaker.state).toBe('OPEN');

      // Immediate fail fast without invoking action
      let actionInvoked = false;
      await expect(
        breaker.execute(async () => {
          actionInvoked = true;
          return 'ok';
        })
      ).rejects.toThrow(CircuitBreakerOpenError);

      expect(actionInvoked).toBe(false); // Action was protected
    });

    it('should recover through HALF_OPEN and CLOSE after the cooldown when the trial call succeeds', async () => {
      vi.useFakeTimers();
      const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownPeriodMs: 1000 });
      const failingCall = () => Promise.reject(new Error('Downstream 503'));

      // Trip the circuit to OPEN.
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      expect(breaker.state).toBe('OPEN');

      // Before the cooldown elapses the breaker stays OPEN and fails fast.
      vi.advanceTimersByTime(999);
      expect(breaker.state).toBe('OPEN');

      // After the cooldown it moves to HALF_OPEN to allow a single trial call.
      vi.advanceTimersByTime(1);
      expect(breaker.state).toBe('HALF_OPEN');

      // A successful trial call closes the circuit again.
      await expect(breaker.execute(async () => 'recovered')).resolves.toBe('recovered');
      expect(breaker.state).toBe('CLOSED');
    });

    it('should re-OPEN immediately if the HALF_OPEN trial call fails again', async () => {
      vi.useFakeTimers();
      const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownPeriodMs: 1000 });
      const failingCall = () => Promise.reject(new Error('Still down'));

      await expect(breaker.execute(failingCall)).rejects.toThrow();
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      expect(breaker.state).toBe('OPEN');

      // Cooldown elapses -> HALF_OPEN.
      vi.advanceTimersByTime(1000);
      expect(breaker.state).toBe('HALF_OPEN');

      // The single trial call fails -> circuit trips back to OPEN without
      // waiting to reach the threshold again.
      await expect(breaker.execute(failingCall)).rejects.toThrow();
      expect(breaker.state).toBe('OPEN');
    });
  });

  describe('Bulkhead Isolation', () => {
    it('should reject requests exceeding max concurrency limit', async () => {
      const bulkhead = new BulkheadIsolation(2); // Max 2 concurrent tasks

      let resolveTask1: () => void;
      let resolveTask2: () => void;

      const p1 = bulkhead.execute(() => new Promise<void>((r) => (resolveTask1 = r)));
      const p2 = bulkhead.execute(() => new Promise<void>((r) => (resolveTask2 = r)));

      expect(bulkhead.currentLoad).toBe(2);

      // Third concurrent task must be rejected immediately
      await expect(bulkhead.execute(async () => 'overflow')).rejects.toThrow(BulkheadFullError);

      // Release tasks
      resolveTask1!();
      resolveTask2!();
      await Promise.all([p1, p2]);

      expect(bulkhead.currentLoad).toBe(0);
    });
  });

  describe('Cache Stampede (Single-Flight Mutex)', () => {
    it('should coalesce 50 concurrent requests into 1 single database query on cache miss', async () => {
      const cache = new SingleFlightCache();

      const slowDbQuery = async () => {
        await new Promise((r) => setTimeout(r, 20)); // 20ms DB latency
        return { productId: 'prod_999', price: 99.9 };
      };

      // 50 concurrent incoming requests at the same instant
      const requests = Array.from({ length: 50 }).map(() =>
        cache.getOrFetch('products:prod_999', 500, slowDbQuery)
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(50);
      expect(results[0].productId).toBe('prod_999');

      // Crucial verification: ONLY 1 single DB query hit the database!
      expect(cache.databaseQueryCount).toBe(1);
    });
  });

  describe('Retry with Exponential Backoff + Jitter', () => {
    it('should retry a transient failure and eventually succeed', async () => {
      let attempts = 0;
      const flaky = async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('Transient network blip');
        return 'success';
      };

      const result = await retryWithBackoff(flaky, {
        maxAttempts: 5,
        baseDelayMs: 10,
        // Deterministic seams: no real waiting, no real randomness.
        sleep: async () => {},
        random: () => 0.5,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should apply exponential backoff and dessynchronize retries via full jitter', async () => {
      const delays: number[] = [];
      let attempts = 0;

      await expect(
        retryWithBackoff(
          async () => {
            attempts += 1;
            throw new Error('Always down');
          },
          {
            maxAttempts: 4,
            baseDelayMs: 100,
            jitter: 'full',
            // random = 0.5 -> jitter picks half of the exponential ceiling.
            random: () => 0.5,
            sleep: async (ms) => {
              delays.push(ms);
            },
          }
        )
      ).rejects.toThrow(RetryExhaustedError);

      // Exponential ceilings: 100, 200, 400. Full jitter at 0.5 -> half of each.
      // 3 waits happen between 4 attempts.
      expect(delays).toEqual([50, 100, 200]);
      expect(attempts).toBe(4);
    });

    it('should not retry when the error is classified as non-retryable', async () => {
      let attempts = 0;
      class ValidationError extends Error {}

      await expect(
        retryWithBackoff(
          async () => {
            attempts += 1;
            throw new ValidationError('Bad request — retrying is pointless');
          },
          {
            maxAttempts: 5,
            baseDelayMs: 10,
            sleep: async () => {},
            isRetryable: (err) => !(err instanceof ValidationError),
          }
        )
      ).rejects.toThrow(RetryExhaustedError);

      // Fail-fast on a permanent error: only the first attempt ran.
      expect(attempts).toBe(1);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { CircuitBreaker, CircuitBreakerOpenError } from './circuit-breaker.js';
import { BulkheadIsolation, BulkheadFullError } from './bulkhead.js';
import { SingleFlightCache } from './single-flight-cache.js';

describe('Fase 7: Resilience & Distributed Patterns (Circuit Breaker, Bulkhead, Cache Stampede)', () => {
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
});

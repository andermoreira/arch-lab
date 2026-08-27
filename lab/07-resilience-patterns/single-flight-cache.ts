export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SingleFlightCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  public databaseQueryCount: number = 0;

  public async getOrFetch<T>(
    key: string,
    ttlMs: number,
    fetchFromDb: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const cached = this.store.get(key) as CacheEntry<T> | undefined;

    // 1. Cache hit & not expired
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // 2. Cache miss or expired: Single-Flight Mutex Coalescing
    if (this.inFlight.has(key)) {
      // Join existing in-flight promise (prevents Thundering Herd)
      return (await this.inFlight.get(key)) as T;
    }

    // 3. Initiate single database fetch
    const fetchPromise = (async () => {
      try {
        this.databaseQueryCount += 1;
        const freshValue = await fetchFromDb();
        this.store.set(key, {
          value: freshValue,
          expiresAt: Date.now() + ttlMs,
        });
        return freshValue;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    return await fetchPromise;
  }

  public invalidate(key: string): void {
    this.store.delete(key);
  }
}

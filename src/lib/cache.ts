// src/lib/cache.ts

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class CacheHelper {
  private kv: KVNamespace | null;
  private memory: Map<string, CacheEntry> = new Map();

  constructor(kv: KVNamespace | null) {
    this.kv = kv;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.kv) {
      const raw = await this.kv.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (this.kv) {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttlSeconds,
      });
      return;
    }

    this.memory.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

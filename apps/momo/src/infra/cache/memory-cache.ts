import type { CacheDriver, CacheSetOptions } from './cache.types'
import { parseCacheValue, serializeCacheValue } from './cache-json'

export interface MemoryCacheConfig {
  defaultTtlSeconds: number
  keyPrefix: string
}

interface MemoryCacheEntry {
  expiresAt: number
  value: string
}

export class MemoryCache implements CacheDriver {
  private readonly entries = new Map<string, MemoryCacheEntry>()

  constructor(private readonly config: MemoryCacheConfig) {}

  async get<T>(key: string): Promise<T | undefined> {
    const cacheKey = this.resolveKey(key)
    const entry = this.entries.get(cacheKey)

    if (!entry) {
      return undefined
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(cacheKey)
      return undefined
    }

    try {
      return parseCacheValue<T>(entry.value)
    } catch {
      this.entries.delete(cacheKey)
      return undefined
    }
  }

  async set(key: string, value: unknown, options: CacheSetOptions = {}): Promise<void> {
    const serialized = serializeCacheValue(value)

    if (serialized === undefined) {
      return
    }

    const ttlSeconds = options.ttlSeconds ?? this.config.defaultTtlSeconds

    this.entries.set(this.resolveKey(key), {
      expiresAt: Date.now() + ttlSeconds * 1000,
      value: serialized,
    })
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(this.resolveKey(key))
  }

  async wrap<T>(key: string, loader: () => Promise<T>, options: CacheSetOptions = {}): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== undefined) {
      return cached
    }

    const value = await loader()
    await this.set(key, value, options)

    return value
  }

  async close(): Promise<void> {
    this.entries.clear()
  }

  private resolveKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`
  }
}


import type { MomoLogger } from '#momo/infra/logger'
import type { CacheDriver, CacheSetOptions } from './cache.types'
import { createClient } from 'redis'
import { parseCacheValue, serializeCacheValue } from './cache-json'

export interface RedisCacheConfig {
  defaultTtlSeconds: number
  keyPrefix: string
  url: string
}

export interface RedisCacheClient {
  isOpen?: boolean
  connect: () => Promise<unknown>
  del: (key: string) => Promise<unknown>
  get: (key: string) => Promise<string | null>
  on?: (event: 'error', listener: (error: Error) => void) => RedisCacheClient
  quit: () => Promise<unknown>
  setEx: (key: string, seconds: number, value: string) => Promise<unknown>
}

export class RedisCache implements CacheDriver {
  private connectPromise: Promise<void> | undefined

  constructor(
    private readonly config: RedisCacheConfig,
    private readonly client: RedisCacheClient = createClient({ url: config.url }) as unknown as RedisCacheClient,
    logger?: MomoLogger,
  ) {
    this.client.on?.('error', (error) => {
      logger?.error({ event: 'cache.redis.error', message: error.message }, 'Redis 缓存连接异常')
    })
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.ensureConnected()

    const cacheKey = this.resolveKey(key)
    const value = await this.client.get(cacheKey)

    if (value === null) {
      return undefined
    }

    try {
      return parseCacheValue<T>(value)
    } catch {
      await this.client.del(cacheKey)
      return undefined
    }
  }

  async set(key: string, value: unknown, options: CacheSetOptions = {}): Promise<void> {
    const serialized = serializeCacheValue(value)

    if (serialized === undefined) {
      return
    }

    await this.ensureConnected()
    await this.client.setEx(this.resolveKey(key), options.ttlSeconds ?? this.config.defaultTtlSeconds, serialized)
  }

  async delete(key: string): Promise<void> {
    await this.ensureConnected()
    await this.client.del(this.resolveKey(key))
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
    if (!this.client.isOpen) {
      return
    }

    await this.client.quit()
    this.connectPromise = undefined
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return
    }

    this.connectPromise ??= this.client.connect().then(() => undefined)
    await this.connectPromise
  }

  private resolveKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`
  }
}

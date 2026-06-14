import type { RedisCacheClient } from '#momo/infra/cache'
import { RedisCache } from '#momo/infra/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function createClient(): RedisCacheClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(1),
    get: vi.fn().mockResolvedValue(null),
    isOpen: false,
    quit: vi.fn().mockResolvedValue(undefined),
    setEx: vi.fn().mockResolvedValue('OK'),
  }
}

function createCache(client: RedisCacheClient) {
  return new RedisCache(
    {
      defaultTtlSeconds: 300,
      keyPrefix: 'momo',
      url: 'redis://localhost:56379',
    },
    client,
  )
}

describe('redis cache', () => {
  let client: RedisCacheClient

  beforeEach(() => {
    client = createClient()
  })

  it('读取时懒连接 Redis', async () => {
    const cache = createCache(client)

    await cache.get('user:1')

    expect(client.connect).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith('momo:user:1')
  })

  it('写入时使用 setEx 和默认 TTL', async () => {
    const cache = createCache(client)

    await cache.set('user:1', { name: 'momo' })

    expect(client.setEx).toHaveBeenCalledWith('momo:user:1', 300, '{"name":"momo"}')
  })

  it('写入时允许覆盖 TTL', async () => {
    const cache = createCache(client)

    await cache.set('user:1', 'value', { ttlSeconds: 60 })

    expect(client.setEx).toHaveBeenCalledWith('momo:user:1', 60, '"value"')
  })

  it('undefined 不连接 Redis 也不写入', async () => {
    const cache = createCache(client)

    await cache.set('empty', undefined)

    expect(client.connect).not.toHaveBeenCalled()
    expect(client.setEx).not.toHaveBeenCalled()
  })

  it('命中时解析 JSON', async () => {
    vi.mocked(client.get).mockResolvedValue('{"name":"momo"}')
    const cache = createCache(client)

    await expect(cache.get('user:1')).resolves.toEqual({ name: 'momo' })
  })

  it('json 解析失败时删除坏值并返回 undefined', async () => {
    vi.mocked(client.get).mockResolvedValue('{bad-json')
    const cache = createCache(client)

    await expect(cache.get('user:1')).resolves.toBeUndefined()
    expect(client.del).toHaveBeenCalledWith('momo:user:1')
  })

  it('delete 会删除加前缀后的键', async () => {
    const cache = createCache(client)

    await cache.delete('user:1')

    expect(client.del).toHaveBeenCalledWith('momo:user:1')
  })

  it('wrap 命中时不调用 loader', async () => {
    vi.mocked(client.get).mockResolvedValue('"cached"')
    const cache = createCache(client)
    const loader = vi.fn().mockResolvedValue('loaded')

    const value = await cache.wrap('key', loader)

    expect(value).toBe('cached')
    expect(loader).not.toHaveBeenCalled()
  })

  it('close 在连接打开时调用 quit', async () => {
    client.isOpen = true
    const cache = createCache(client)

    await cache.close()

    expect(client.quit).toHaveBeenCalledTimes(1)
  })
})

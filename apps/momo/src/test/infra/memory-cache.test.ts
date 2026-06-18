import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryCache } from '#momo/infra/cache'

function createCache() {
  return new MemoryCache({
    defaultTtlSeconds: 300,
    keyPrefix: 'momo',
  })
}

describe('memory 缓存', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('set 后可以读取 JSON 数据', async () => {
    const cache = createCache()

    await cache.set('user:1', { name: 'momo' })

    await expect(cache.get('user:1')).resolves.toEqual({ name: 'momo' })
  })

  it('miss 时返回 undefined', async () => {
    const cache = createCache()

    await expect(cache.get('missing')).resolves.toBeUndefined()
  })

  it('ttl 到期后返回 undefined', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const cache = createCache()

    await cache.set('short', 'value', { ttlSeconds: 1 })
    vi.setSystemTime(new Date('2026-01-01T00:00:01.001Z'))

    await expect(cache.get('short')).resolves.toBeUndefined()
  })

  it('delete 会删除缓存', async () => {
    const cache = createCache()

    await cache.set('user:1', { name: 'momo' })
    await cache.delete('user:1')

    await expect(cache.get('user:1')).resolves.toBeUndefined()
  })

  it('wrap 命中时不调用 loader', async () => {
    const cache = createCache()
    const loader = vi.fn().mockResolvedValue('loaded')

    await cache.set('key', 'cached')
    const value = await cache.wrap('key', loader)

    expect(value).toBe('cached')
    expect(loader).not.toHaveBeenCalled()
  })

  it('wrap 未命中时调用一次 loader 并写入缓存', async () => {
    const cache = createCache()
    const loader = vi.fn().mockResolvedValue({ name: 'loaded' })

    const value = await cache.wrap('key', loader)

    expect(value).toEqual({ name: 'loaded' })
    expect(loader).toHaveBeenCalledTimes(1)
    await expect(cache.get('key')).resolves.toEqual({ name: 'loaded' })
  })

  it('undefined 不写入缓存', async () => {
    const cache = createCache()

    await cache.set('empty', undefined)

    await expect(cache.get('empty')).resolves.toBeUndefined()
  })
})

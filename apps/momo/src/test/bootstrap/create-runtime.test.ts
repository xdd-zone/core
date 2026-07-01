import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRuntime } from '#momo/bootstrap'
import { MemoryCache, RedisCache } from '#momo/infra/cache'
import { DisabledSearch, MeilisearchSearch } from '#momo/infra/search'

function stubBaseEnv() {
  vi.stubEnv('APP_ENV', 'test')
  vi.stubEnv('BETTER_AUTH_SECRET', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:7788')
  vi.stubEnv('CORS_ORIGINS', 'http://localhost:2333')
  vi.stubEnv('DATABASE_URL', 'postgres://momo:momo@localhost:55432/momo_test')
  vi.stubEnv('GITHUB_CLIENT_ID', 'test-github-client-id')
  vi.stubEnv('GITHUB_CLIENT_SECRET', 'test-github-client-secret')
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client-id')
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-client-secret')
  vi.stubEnv('LLM_SECRET_KEY', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')
  vi.stubEnv('PORT', '7788')
}

describe('runtime 创建', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('默认创建 memory 缓存', () => {
    stubBaseEnv()

    const runtime = createRuntime()

    expect(runtime.cache).toBeInstanceOf(MemoryCache)
  })

  it('cache_provider=redis 时创建 Redis 缓存', () => {
    stubBaseEnv()
    vi.stubEnv('CACHE_PROVIDER', 'redis')
    vi.stubEnv('CACHE_URL', 'redis://localhost:56379')

    const runtime = createRuntime()

    expect(runtime.cache).toBeInstanceOf(RedisCache)
  })

  it('默认创建禁用搜索驱动', () => {
    stubBaseEnv()

    const runtime = createRuntime()

    expect(runtime.search).toBeInstanceOf(DisabledSearch)
  })

  it('search_provider=meilisearch 时创建 Meilisearch 搜索驱动', () => {
    stubBaseEnv()
    vi.stubEnv('SEARCH_PROVIDER', 'meilisearch')
    vi.stubEnv('MEILI_HOST', 'http://localhost:57700')
    vi.stubEnv('MEILI_API_KEY', 'momo-meilisearch-development-master-key')

    const runtime = createRuntime()

    expect(runtime.search).toBeInstanceOf(MeilisearchSearch)
  })
})

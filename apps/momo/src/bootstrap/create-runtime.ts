import type { Logger } from 'pino'
import type { BoboRevalidateClient } from '#momo/infra/bobo'
import type { CacheDriver } from '#momo/infra/cache'
import type { LogReader } from '#momo/infra/logs'
import type { SearchDriver } from '#momo/infra/search'
import type { StorageDriver } from '#momo/infra/storage/storage.types'
import type { MomoEnv } from '#momo/shared/env'
import { resolve } from 'node:path'
import { DisabledBoboRevalidateClient, HttpBoboRevalidateClient } from '#momo/infra/bobo'
import { MemoryCache, RedisCache } from '#momo/infra/cache'
import { createChildLogger, createLogger } from '#momo/infra/logger'
import { DisabledLogReader, LokiLogReader } from '#momo/infra/logs'
import { DisabledSearch, MeilisearchSearch } from '#momo/infra/search'
import { CosStorage } from '#momo/infra/storage/cos-storage'
import { LocalStorage } from '#momo/infra/storage/local-storage'
import { getMomoEnv } from '#momo/shared/env'

export interface MomoRuntime {
  boboRevalidate: BoboRevalidateClient
  cache: CacheDriver
  env: ReturnType<typeof getMomoEnv>
  logger: Logger
  logs: LogReader
  search: SearchDriver
  storage: StorageDriver
}

function createCacheDriver(env: MomoEnv, logger: Logger): CacheDriver {
  const cacheLogger = createChildLogger(logger, 'cache')
  const config = {
    defaultTtlSeconds: env.CACHE_DEFAULT_TTL_SECONDS,
    keyPrefix: env.CACHE_KEY_PREFIX,
  }

  if (env.CACHE_PROVIDER === 'redis') {
    if (!env.CACHE_URL) {
      throw new Error('CACHE_PROVIDER=redis 时，CACHE_URL 必须配置')
    }

    cacheLogger.info({ provider: 'redis' }, '使用 Redis 缓存')

    return new RedisCache(
      {
        ...config,
        url: env.CACHE_URL,
      },
      undefined,
      cacheLogger,
    )
  }

  cacheLogger.info({ provider: 'memory' }, '使用内存缓存')

  return new MemoryCache(config)
}

function createSearchDriver(env: MomoEnv, logger: Logger): SearchDriver {
  const searchLogger = createChildLogger(logger, 'search')

  if (env.SEARCH_PROVIDER === 'meilisearch') {
    if (!env.MEILI_HOST || !env.MEILI_API_KEY) {
      throw new Error('SEARCH_PROVIDER=meilisearch 时，MEILI_HOST、MEILI_API_KEY 必须配置')
    }

    searchLogger.info({ provider: 'meilisearch', host: env.MEILI_HOST }, '使用 Meilisearch 搜索')

    return new MeilisearchSearch(
      {
        apiKey: env.MEILI_API_KEY,
        host: env.MEILI_HOST,
        indexPrefix: env.MEILI_INDEX_PREFIX,
      },
      undefined,
      searchLogger,
    )
  }

  searchLogger.info({ provider: 'none' }, '未启用搜索服务')
  return new DisabledSearch()
}

function createStorageDriver(env: MomoEnv, logger: Logger): StorageDriver {
  const storageLogger = createChildLogger(logger, 'storage')

  if (env.STORAGE_PROVIDER === 'cos') {
    if (!env.COS_SECRET_ID || !env.COS_SECRET_KEY || !env.COS_BUCKET || !env.COS_REGION) {
      throw new Error('STORAGE_PROVIDER=cos 时，COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION 必须配置')
    }

    storageLogger.info({ provider: 'cos', bucket: env.COS_BUCKET, region: env.COS_REGION }, '使用 COS 存储')

    return new CosStorage({
      secretId: env.COS_SECRET_ID,
      secretKey: env.COS_SECRET_KEY,
      bucket: env.COS_BUCKET,
      region: env.COS_REGION,
      keyPrefix: env.COS_KEY_PREFIX,
      publicBaseUrl: env.COS_PUBLIC_BASE_URL,
      signedUrlExpires: env.COS_SIGNED_URL_EXPIRES,
    })
  }

  const rootDir = env.LOCAL_STORAGE_DIR ?? resolve(process.cwd(), 'storage/media')
  storageLogger.info({ provider: 'local', rootDir }, '使用本地存储')
  return new LocalStorage(rootDir)
}

function createBoboRevalidateClient(env: MomoEnv, logger: Logger): BoboRevalidateClient {
  const boboLogger = createChildLogger(logger, 'bobo')

  if (!env.BOBO_BASE_URL || !env.BOBO_REVALIDATE_SECRET) {
    boboLogger.info('未配置 Bobo 缓存刷新')
    return new DisabledBoboRevalidateClient()
  }

  return new HttpBoboRevalidateClient(
    {
      baseUrl: env.BOBO_BASE_URL,
      secret: env.BOBO_REVALIDATE_SECRET,
    },
    boboLogger,
  )
}

function createLogReader(env: MomoEnv): LogReader {
  if (env.LOG_READER_PROVIDER === 'none') {
    return new DisabledLogReader()
  }

  if (!env.LOKI_URL) {
    throw new Error('LOG_READER_PROVIDER=loki 时，LOKI_URL 必须配置')
  }

  return new LokiLogReader({
    password: env.LOKI_PASSWORD,
    tenantId: env.LOKI_TENANT_ID,
    timeoutMs: env.LOG_QUERY_TIMEOUT_MS,
    url: env.LOKI_URL,
    username: env.LOKI_USERNAME,
  })
}

export function createRuntime(): MomoRuntime {
  const env = getMomoEnv()
  const logger = createLogger(env)

  return {
    boboRevalidate: createBoboRevalidateClient(env, logger),
    cache: createCacheDriver(env, logger),
    env,
    logger,
    logs: createLogReader(env),
    search: createSearchDriver(env, logger),
    storage: createStorageDriver(env, logger),
  }
}

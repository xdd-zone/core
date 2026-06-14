import type { CacheDriver } from '#momo/infra/cache'
import type { StorageDriver } from '#momo/infra/storage/storage.types'
import type { MomoEnv } from '#momo/shared/env'
import type { Logger } from 'pino'
import { resolve } from 'node:path'
import { MemoryCache, RedisCache } from '#momo/infra/cache'
import { createChildLogger, createLogger } from '#momo/infra/logger'
import { CosStorage } from '#momo/infra/storage/cos-storage'
import { LocalStorage } from '#momo/infra/storage/local-storage'
import { getMomoEnv } from '#momo/shared/env'

export interface MomoRuntime {
  cache: CacheDriver
  env: ReturnType<typeof getMomoEnv>
  logger: Logger
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

export function createRuntime(): MomoRuntime {
  const env = getMomoEnv()
  const logger = createLogger(env)

  return {
    cache: createCacheDriver(env, logger),
    env,
    logger,
    storage: createStorageDriver(env, logger),
  }
}

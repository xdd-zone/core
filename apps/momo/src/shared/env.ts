import { z } from 'zod'

const logLevelSchema = z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'])

const optionalStringSchema = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional())

const optionalUrlSchema = z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional())

const momoEnvSchema = z
  .object({
    APP_ENV: z.enum(['development', 'test', 'production']),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    CACHE_KEY_PREFIX: z.string().min(1).default('momo'),
    CACHE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
    CACHE_URL: optionalUrlSchema,
    CORS_ORIGINS: z.preprocess((value) => {
      if (typeof value !== 'string') {
        return value
      }

      return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    }, z.array(z.string().url()).min(1)),
    DATABASE_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    MEILI_API_KEY: optionalStringSchema,
    MEILI_HOST: optionalUrlSchema,
    MEILI_INDEX_PREFIX: z.string().min(1).default('momo'),
    LOG_LEVEL: logLevelSchema.optional(),
    LOG_SQL: z.preprocess((value) => {
      if (value === undefined) {
        return false
      }

      if (value === 'true') {
        return true
      }

      if (value === 'false') {
        return false
      }

      return value
    }, z.boolean()),
    PORT: z.coerce.number().int().min(1).max(65535),
    SEARCH_PROVIDER: z.enum(['none', 'meilisearch']).default('none'),
    STORAGE_PROVIDER: z.enum(['local', 'cos']).default('local'),
    LOCAL_STORAGE_DIR: optionalStringSchema,
    COS_SECRET_ID: optionalStringSchema,
    COS_SECRET_KEY: optionalStringSchema,
    COS_BUCKET: optionalStringSchema,
    COS_REGION: optionalStringSchema,
    COS_PUBLIC_BASE_URL: optionalUrlSchema,
    COS_KEY_PREFIX: z.string().default('media'),
    COS_SIGNED_URL_EXPIRES: z.coerce.number().int().min(60).default(600),
  })
  .superRefine((env, ctx) => {
    if (env.CACHE_PROVIDER === 'redis' && !env.CACHE_URL) {
      ctx.addIssue({
        code: 'custom',
        message: 'CACHE_PROVIDER=redis 时，CACHE_URL 必须配置',
        path: ['CACHE_URL'],
      })
    }

    if (env.SEARCH_PROVIDER === 'meilisearch' && !env.MEILI_HOST) {
      ctx.addIssue({
        code: 'custom',
        message: 'SEARCH_PROVIDER=meilisearch 时，MEILI_HOST 必须配置',
        path: ['MEILI_HOST'],
      })
    }

    if (env.SEARCH_PROVIDER === 'meilisearch' && !env.MEILI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        message: 'SEARCH_PROVIDER=meilisearch 时，MEILI_API_KEY 必须配置',
        path: ['MEILI_API_KEY'],
      })
    }
  })
  .transform((env) => ({
    ...env,
    LOG_LEVEL: env.LOG_LEVEL ?? (env.APP_ENV === 'test' ? 'silent' : 'info'),
  }))

export type MomoEnv = z.infer<typeof momoEnvSchema>

export function getMomoEnv(source: NodeJS.ProcessEnv = process.env): MomoEnv {
  return momoEnvSchema.parse({
    APP_ENV: source.APP_ENV,
    BETTER_AUTH_SECRET: source.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: source.BETTER_AUTH_URL,
    CACHE_DEFAULT_TTL_SECONDS: source.CACHE_DEFAULT_TTL_SECONDS,
    CACHE_KEY_PREFIX: source.CACHE_KEY_PREFIX,
    CACHE_PROVIDER: source.CACHE_PROVIDER,
    CACHE_URL: source.CACHE_URL,
    CORS_ORIGINS: source.CORS_ORIGINS,
    DATABASE_URL: source.DATABASE_URL,
    GITHUB_CLIENT_ID: source.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: source.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: source.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: source.GOOGLE_CLIENT_SECRET,
    MEILI_API_KEY: source.MEILI_API_KEY,
    MEILI_HOST: source.MEILI_HOST,
    MEILI_INDEX_PREFIX: source.MEILI_INDEX_PREFIX,
    LOG_LEVEL: source.LOG_LEVEL,
    LOG_SQL: source.LOG_SQL,
    PORT: source.PORT,
    SEARCH_PROVIDER: source.SEARCH_PROVIDER,
    STORAGE_PROVIDER: source.STORAGE_PROVIDER,
    LOCAL_STORAGE_DIR: source.LOCAL_STORAGE_DIR,
    COS_SECRET_ID: source.COS_SECRET_ID,
    COS_SECRET_KEY: source.COS_SECRET_KEY,
    COS_BUCKET: source.COS_BUCKET,
    COS_REGION: source.COS_REGION,
    COS_PUBLIC_BASE_URL: source.COS_PUBLIC_BASE_URL,
    COS_KEY_PREFIX: source.COS_KEY_PREFIX,
    COS_SIGNED_URL_EXPIRES: source.COS_SIGNED_URL_EXPIRES,
  })
}

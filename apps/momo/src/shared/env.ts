import { z } from 'zod'

const logLevelSchema = z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'])

const momoEnvSchema = z
  .object({
    APP_ENV: z.enum(['development', 'test', 'production']),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
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
    CORS_ORIGINS: source.CORS_ORIGINS,
    DATABASE_URL: source.DATABASE_URL,
    GITHUB_CLIENT_ID: source.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: source.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: source.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: source.GOOGLE_CLIENT_SECRET,
    LOG_LEVEL: source.LOG_LEVEL,
    LOG_SQL: source.LOG_SQL,
    PORT: source.PORT,
  })
}

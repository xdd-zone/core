import { z } from 'zod'

const momoEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
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
  PORT: z.coerce.number().int().min(1).max(65535),
})

export type MomoEnv = z.infer<typeof momoEnvSchema>

export function getMomoEnv(source: NodeJS.ProcessEnv = process.env): MomoEnv {
  return momoEnvSchema.parse({
    APP_ENV: source.APP_ENV,
    CORS_ORIGINS: source.CORS_ORIGINS,
    DATABASE_URL: source.DATABASE_URL,
    PORT: source.PORT,
  })
}

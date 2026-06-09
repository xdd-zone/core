import { z } from 'zod'

const momoEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535).default(7788),
})

export type MomoEnv = z.infer<typeof momoEnvSchema>

export function getMomoEnv(source: NodeJS.ProcessEnv = process.env): MomoEnv {
  return momoEnvSchema.parse({
    APP_ENV: source.APP_ENV,
    PORT: source.PORT,
  })
}

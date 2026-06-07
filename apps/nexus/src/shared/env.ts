import { z } from 'zod'

const nexusEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535).default(7788),
})

export type NexusEnv = z.infer<typeof nexusEnvSchema>

export function getNexusEnv(source: NodeJS.ProcessEnv = process.env): NexusEnv {
  return nexusEnvSchema.parse({
    APP_ENV: source.APP_ENV,
    PORT: source.PORT,
  })
}

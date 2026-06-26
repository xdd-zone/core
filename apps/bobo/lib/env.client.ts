import { z } from 'zod'

export const boboClientEnvSchema = z.object({})

export type BoboClientEnv = z.infer<typeof boboClientEnvSchema>

export function getBoboClientEnv(): BoboClientEnv {
  return boboClientEnvSchema.parse({})
}

import { z } from 'zod'

const fifaEnvSchema = z.object({
  VITE_APP_ENV: z.enum(['development', 'test', 'production']),
  VITE_MOMO_BASE_URL: z.string().url(),
})

export type FifaEnv = z.infer<typeof fifaEnvSchema>

export function getFifaEnv(): FifaEnv {
  return fifaEnvSchema.parse({
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_MOMO_BASE_URL: import.meta.env.VITE_MOMO_BASE_URL,
  })
}

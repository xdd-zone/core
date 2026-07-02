import { z } from 'zod'

export const boboServerEnvSchema = z.object({
  MOMO_BASE_URL: z.string().url(),
  BOBO_ALLOWED_DEV_ORIGINS: z.string().optional(),
  BOBO_REVALIDATE_SECRET: z.string().optional(),
})

export type BoboServerEnv = z.infer<typeof boboServerEnvSchema>

export function getBoboServerEnv(): BoboServerEnv {
  return boboServerEnvSchema.parse({
    MOMO_BASE_URL: process.env.MOMO_BASE_URL,
    BOBO_ALLOWED_DEV_ORIGINS: process.env.BOBO_ALLOWED_DEV_ORIGINS,
    BOBO_REVALIDATE_SECRET: process.env.BOBO_REVALIDATE_SECRET,
  })
}

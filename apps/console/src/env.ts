import { z } from 'zod'

const consoleEnvSchema = z.object({
  VITE_APP_ENV: z.enum(['development', 'test', 'production']),
  VITE_NEXUS_BASE_URL: z.string().url(),
})

export type ConsoleEnv = z.infer<typeof consoleEnvSchema>

export function getConsoleEnv(): ConsoleEnv {
  return consoleEnvSchema.parse({
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_NEXUS_BASE_URL: import.meta.env.VITE_NEXUS_BASE_URL,
  })
}

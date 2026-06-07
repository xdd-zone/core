import { z } from 'zod'

export const HealthResponseSchema = z.object({
  env: z.enum(['development', 'test', 'production']),
  service: z.literal('nexus'),
  status: z.literal('ok'),
})

export type HealthResponse = z.infer<typeof HealthResponseSchema>

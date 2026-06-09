import { z } from 'zod'

export const PingRequestSchema = z.object({
  name: z.string().trim().min(1),
})

export const PingResponseSchema = z.object({
  env: z.enum(['development', 'test', 'production']),
  service: z.literal('momo'),
  message: z.string(),
})

export type PingRequest = z.infer<typeof PingRequestSchema>
export type PingResponse = z.infer<typeof PingResponseSchema>

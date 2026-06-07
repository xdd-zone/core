import { z } from 'zod'

export const RootResponseSchema = z.object({
  name: z.literal('@xdd-zone/nexus'),
  status: z.literal('ok'),
})

export type RootResponse = z.infer<typeof RootResponseSchema>

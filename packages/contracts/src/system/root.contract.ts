import { z } from 'zod'

export const RootResponseSchema = z.object({
  name: z.literal('@xdd-zone/momo'),
  status: z.literal('ok'),
})

export type RootResponse = z.infer<typeof RootResponseSchema>

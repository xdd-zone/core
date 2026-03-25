import { z } from 'zod'

/**
 * 健康检查响应。
 */
export const HealthSchema = z.object({
  status: z.literal('ok'),
})

export type Health = z.infer<typeof HealthSchema>

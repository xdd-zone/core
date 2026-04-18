import { z } from 'zod'

/**
 * 健康检查响应。
 */
export const HealthDependencySchema = z.object({
  status: z.enum(['up', 'down']),
})

export const HealthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  timestamp: z.iso.datetime(),
  service: z.string().min(1),
  version: z.string().min(1),
  uptime: z.number().nonnegative(),
  database: HealthDependencySchema,
})

export type Health = z.infer<typeof HealthSchema>

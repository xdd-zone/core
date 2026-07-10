import { z } from 'zod'

export const SYSTEM_READINESS_COMPONENT_VALUES = ['database', 'cache', 'search', 'storage'] as const

export const SystemReadinessComponentSchema = z.enum(SYSTEM_READINESS_COMPONENT_VALUES)
export const SystemReadinessCheckStatusSchema = z.enum(['ready', 'disabled', 'error'])

export const SystemReadinessCheckSchema = z.object({
  durationMs: z.number().nonnegative(),
  message: z.string().optional(),
  name: SystemReadinessComponentSchema,
  provider: z.string().min(1),
  status: SystemReadinessCheckStatusSchema,
})

export const SystemReadinessResponseSchema = z.object({
  checkedAt: z.string().datetime(),
  checks: z.array(SystemReadinessCheckSchema),
  status: z.enum(['ready', 'degraded']),
})

export type SystemReadinessCheck = z.infer<typeof SystemReadinessCheckSchema>
export type SystemReadinessCheckStatus = z.infer<typeof SystemReadinessCheckStatusSchema>
export type SystemReadinessComponent = z.infer<typeof SystemReadinessComponentSchema>
export type SystemReadinessResponse = z.infer<typeof SystemReadinessResponseSchema>

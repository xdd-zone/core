import { z } from 'zod'

export const SYSTEM_LOG_LEVEL_VALUES = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const
export const SYSTEM_LOG_RANGE_MINUTE_VALUES = [15, 60, 360, 1440] as const

export const SystemLogLevelSchema = z.enum(SYSTEM_LOG_LEVEL_VALUES)

export const SystemLogListQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(8192).optional(),
  event: z.string().trim().min(1).max(200).optional(),
  from: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  minDurationMs: z.coerce.number().nonnegative().max(300_000).optional(),
  minLevel: SystemLogLevelSchema.default('warn'),
  module: z.string().trim().min(1).max(100).optional(),
  path: z.string().trim().min(1).max(500).optional(),
  rangeMinutes: z.coerce.number().int().min(15).max(1440).default(60),
  requestId: z.string().trim().min(1).max(200).optional(),
  statusFrom: z.coerce.number().int().min(100).max(599).optional(),
  statusTo: z.coerce.number().int().min(100).max(599).optional(),
  to: z.string().datetime().optional(),
})

export const SystemLogEntrySchema = z.object({
  context: z.record(z.string(), z.unknown()),
  durationMs: z.number().nonnegative().nullable(),
  env: z.string().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  errorName: z.string().nullable(),
  event: z.string().nullable(),
  id: z.string().min(1),
  instance: z.string().nullable(),
  level: SystemLogLevelSchema,
  message: z.string(),
  method: z.string().nullable(),
  module: z.string().nullable(),
  path: z.string().nullable(),
  release: z.string().nullable(),
  requestId: z.string().nullable(),
  service: z.literal('momo'),
  status: z.number().int().nullable(),
  timestamp: z.string().datetime(),
})

export const SystemLogListResponseSchema = z.object({
  from: z.string().datetime(),
  logs: z.array(SystemLogEntrySchema),
  nextCursor: z.string().nullable(),
  queriedAt: z.string().datetime(),
  to: z.string().datetime(),
})

export type SystemLogLevel = z.infer<typeof SystemLogLevelSchema>
export type SystemLogListQuery = z.output<typeof SystemLogListQuerySchema>
export type SystemLogListQueryInput = z.input<typeof SystemLogListQuerySchema>
export type SystemLogEntry = z.infer<typeof SystemLogEntrySchema>
export type SystemLogListResponse = z.infer<typeof SystemLogListResponseSchema>

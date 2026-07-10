import { z } from 'zod'
import { OperationWarningSchema } from '../content/content.contract'

export const EVENT_OUTBOX_STATUS_VALUES = ['pending', 'processing', 'done', 'failed'] as const

export const EventOutboxStatusSchema = z.enum(EVENT_OUTBOX_STATUS_VALUES)

export const EventOutboxListQuerySchema = z.object({
  eventType: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: EventOutboxStatusSchema.optional(),
})

export const EventOutboxListItemSchema = z.object({
  attempts: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  errorMessage: z.string().nullable(),
  eventType: z.string().min(1),
  id: z.string().min(1),
  lastRunAt: z.string().datetime().nullable(),
  nextRunAt: z.string().datetime(),
  status: EventOutboxStatusSchema,
  updatedAt: z.string().datetime(),
})

export const EventOutboxDetailSchema = EventOutboxListItemSchema.extend({
  payload: z.unknown(),
})

export const EventOutboxListResponseSchema = z.object({
  events: z.array(EventOutboxListItemSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const EventOutboxDetailResponseSchema = z.object({
  event: EventOutboxDetailSchema,
})

export const RetryEventOutboxResponseSchema = z.object({
  event: EventOutboxDetailSchema,
  warnings: z.array(OperationWarningSchema),
})

export type EventOutboxDetail = z.infer<typeof EventOutboxDetailSchema>
export type EventOutboxDetailResponse = z.infer<typeof EventOutboxDetailResponseSchema>
export type EventOutboxListItem = z.infer<typeof EventOutboxListItemSchema>
export type EventOutboxListQuery = z.infer<typeof EventOutboxListQuerySchema>
export type EventOutboxListResponse = z.infer<typeof EventOutboxListResponseSchema>
export type EventOutboxStatus = z.infer<typeof EventOutboxStatusSchema>
export type RetryEventOutboxResponse = z.infer<typeof RetryEventOutboxResponseSchema>

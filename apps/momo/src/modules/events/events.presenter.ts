import type { EventOutboxDetail, EventOutboxListItem } from '@xdd-zone/contracts'
import type { EventOutboxRecord } from './types'

export function toEventOutboxListItem(event: EventOutboxRecord): EventOutboxListItem {
  return {
    attempts: event.attempts,
    createdAt: event.createdAt.toISOString(),
    errorMessage: event.errorMessage,
    eventType: event.eventType,
    id: event.id,
    lastRunAt: event.lastRunAt?.toISOString() ?? null,
    nextRunAt: event.nextRunAt.toISOString(),
    status: event.status,
    updatedAt: event.updatedAt.toISOString(),
  }
}

export function toEventOutboxDetail(event: EventOutboxRecord): EventOutboxDetail {
  return {
    ...toEventOutboxListItem(event),
    payload: event.payload,
  }
}

import type {
  EventOutboxDetailResponse,
  EventOutboxListQuery,
  EventOutboxListResponse,
  OperationWarning,
  RetryEventOutboxResponse,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export interface RetryEventsOutboxResponse {
  handled: number
  warnings: OperationWarning[]
}

export function getEventOutbox(eventId: string) {
  return readMomoJson<EventOutboxDetailResponse>(
    momoClient.rpc.events.outbox[':eventId'].$get({
      param: { eventId },
    }),
  )
}

export function listEventsOutbox(query: EventOutboxListQuery) {
  return readMomoJson<EventOutboxListResponse>(
    momoClient.rpc.events.outbox.$get({
      query: {
        ...query,
        page: query.page.toString(),
        pageSize: query.pageSize.toString(),
      },
    }),
  )
}

export function retryEventsOutbox() {
  return readMomoJson<RetryEventsOutboxResponse>(momoClient.rpc.events.outbox.retry.$post())
}

export function retryEventOutbox(eventId: string) {
  return readMomoJson<RetryEventOutboxResponse>(
    momoClient.rpc.events.outbox[':eventId'].retry.$post({
      param: { eventId },
    }),
  )
}

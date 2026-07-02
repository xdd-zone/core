import type { PublishContentPostWarning } from '@fifa/api/content/posts.api'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export interface RetryEventsOutboxResponse {
  handled: number
  warnings: PublishContentPostWarning[]
}

export function retryEventsOutbox() {
  return readMomoJson<RetryEventsOutboxResponse>(momoClient.rpc.events.outbox.retry.$post())
}

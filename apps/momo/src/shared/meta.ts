import type { ApiMeta } from '@xdd-zone/contracts'

export function createMeta(requestId: string = crypto.randomUUID()): ApiMeta {
  return {
    requestId,
    timestamp: new Date().toISOString(),
  }
}

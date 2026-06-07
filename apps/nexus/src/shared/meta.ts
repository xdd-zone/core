import type { ApiMeta } from '@xdd-zone/contracts'

export function createMeta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
}

import type { SystemReadinessResponse } from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function getSystemReadiness() {
  return readMomoJson<SystemReadinessResponse>(momoClient.rpc.system.readiness.$get())
}

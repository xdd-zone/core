import type { HealthResponse } from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function getSystemHealth() {
  return readMomoJson<HealthResponse>(momoClient.health.$get())
}

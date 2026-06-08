import type { HealthResponse } from '@xdd-zone/contracts'

import { nexusClient } from '../client'
import { readNexusJson } from '../rpc'

export function getSystemHealth() {
  return readNexusJson<HealthResponse>(nexusClient.health.$get())
}

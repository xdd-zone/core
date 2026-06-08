import type { PingRequest, PingResponse } from '@xdd-zone/contracts'

import { nexusClient } from '../client'
import { readNexusJson } from '../rpc'

export function pingSystem(payload: PingRequest) {
  return readNexusJson<PingResponse>(
    nexusClient.rpc.system.ping.$post({
      json: payload,
    }),
  )
}

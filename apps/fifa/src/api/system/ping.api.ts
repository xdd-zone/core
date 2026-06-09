import type { PingRequest, PingResponse } from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function pingSystem(payload: PingRequest) {
  return readMomoJson<PingResponse>(
    momoClient.rpc.system.ping.$post({
      json: payload,
    }),
  )
}

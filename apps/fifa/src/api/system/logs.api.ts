import type { SystemLogListQuery, SystemLogListResponse } from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function getSystemLogs(query: SystemLogListQuery) {
  return readMomoJson<SystemLogListResponse>(
    momoClient.rpc.system.logs.$get({
      query: {
        ...query,
        limit: query.limit.toString(),
        minDurationMs: query.minDurationMs?.toString(),
        rangeMinutes: query.rangeMinutes.toString(),
        statusFrom: query.statusFrom?.toString(),
        statusTo: query.statusTo?.toString(),
      },
    }),
  )
}

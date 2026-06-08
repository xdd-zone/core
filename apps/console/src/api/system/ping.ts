import type { ApiResponse, PingRequest, PingResponse } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'

import { nexusClient } from '../client'

export async function pingNexus(payload: PingRequest): Promise<ApiResponse<PingResponse>> {
  try {
    const response = await nexusClient.rpc.system.ping.$post({
      json: payload,
    })

    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: error instanceof Error ? error.message : 'Nexus 请求失败',
      },
      meta: {
        requestId: 'unavailable',
        timestamp: new Date().toISOString(),
      },
    }
  }
}

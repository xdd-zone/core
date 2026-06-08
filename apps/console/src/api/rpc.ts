import type { ApiResponse } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'

interface NexusJsonResponse<TData> {
  json: () => Promise<ApiResponse<TData>>
}

export async function readNexusJson<TData>(request: Promise<NexusJsonResponse<TData>>): Promise<ApiResponse<TData>> {
  try {
    const response = await request

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

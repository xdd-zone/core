import type { ApiResponse } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'

interface MomoJsonResponse<TData> {
  json: () => Promise<ApiResponse<TData>>
}

export async function readMomoJson<TData>(request: Promise<MomoJsonResponse<TData>>): Promise<ApiResponse<TData>> {
  try {
    const response = await request

    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: error instanceof Error ? error.message : 'Momo 请求失败',
      },
      meta: {
        requestId: 'unavailable',
        timestamp: new Date().toISOString(),
      },
    }
  }
}

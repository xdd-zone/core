import type { ApiResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

export function getPreview(token: string): Promise<ApiResponse<unknown>> {
  return http.get<unknown>(`/rpc/previews/${encodeURIComponent(token)}`, {
    init: {
      cache: 'no-store',
    },
  })
}

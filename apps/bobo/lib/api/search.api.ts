import type { ApiResponse, PublicSearchResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

export function searchPublicSite(query: string): Promise<ApiResponse<PublicSearchResponse>> {
  return http.get<PublicSearchResponse>('/rpc/bobo/search', {
    query: {
      q: query,
    },
    init: {
      cache: 'no-store',
    },
  })
}

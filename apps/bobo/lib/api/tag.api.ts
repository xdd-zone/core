import type { ApiResponse, PublicTagListResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicContentInit = {
  next: {
    revalidate: 60,
    tags: ['tags:list'],
  },
} as RequestInit

export function getPublicTags(): Promise<ApiResponse<PublicTagListResponse>> {
  return http.get<PublicTagListResponse>('/rpc/bobo/content/tags', {
    init: publicContentInit,
  })
}

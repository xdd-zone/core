import type { ApiResponse, PublicProfileResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicProfileInit = {
  next: {
    revalidate: 60,
    tags: ['profile:public'],
  },
} as RequestInit

export function getPublicProfile(): Promise<ApiResponse<PublicProfileResponse>> {
  return http.get<PublicProfileResponse>('/rpc/bobo/profile', {
    init: publicProfileInit,
  })
}

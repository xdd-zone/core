import type { ApiResponse, PublicCategoryListResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicContentInit = {
  next: {
    revalidate: 60,
  },
} as RequestInit

export function getPublicCategories(): Promise<ApiResponse<PublicCategoryListResponse>> {
  return http.get<PublicCategoryListResponse>('/rpc/bobo/content/categories', {
    init: publicContentInit,
  })
}

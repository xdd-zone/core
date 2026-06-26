import type { ApiResponse, PublicPostListResponse, PublicPostResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicContentInit = {
  next: {
    revalidate: 60,
  },
} as RequestInit

export function getPublicPosts(filters: {
  categorySlug?: string
  tagSlug?: string
  pageSize?: number
}): Promise<ApiResponse<PublicPostListResponse>> {
  return http.get<PublicPostListResponse>('/rpc/bobo/content/posts', {
    query: {
      categorySlug: filters.categorySlug,
      tagSlug: filters.tagSlug,
      pageSize: filters.pageSize,
    },
    init: publicContentInit,
  })
}

export function getPublicPost(slug: string): Promise<ApiResponse<PublicPostResponse>> {
  return http.get<PublicPostResponse>(`/rpc/bobo/content/posts/${encodeURIComponent(slug)}`, {
    init: publicContentInit,
  })
}

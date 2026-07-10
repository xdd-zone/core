import type { ApiResponse, PublicPostListResponse, PublicPostResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicContentInit = {
  next: {
    revalidate: 60,
    tags: ['posts:list'],
  },
} as RequestInit

function publicPostInit(slug: string) {
  return {
    next: {
      revalidate: 60,
      tags: [`post:${slug}`],
    },
  } as RequestInit
}

export function getPublicPosts(filters: {
  categorySlug?: string
  page?: number
  tagSlug?: string
  pageSize?: number
}): Promise<ApiResponse<PublicPostListResponse>> {
  return http.get<PublicPostListResponse>('/rpc/bobo/content/posts', {
    query: {
      categorySlug: filters.categorySlug,
      page: filters.page,
      tagSlug: filters.tagSlug,
      pageSize: filters.pageSize,
    },
    init: publicContentInit,
  })
}

export function getPublicPost(slug: string): Promise<ApiResponse<PublicPostResponse>> {
  return http.get<PublicPostResponse>(`/rpc/bobo/content/posts/${encodeURIComponent(slug)}`, {
    init: publicPostInit(slug),
  })
}

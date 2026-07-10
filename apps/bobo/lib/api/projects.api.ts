import type { ApiResponse, PublicProjectListResponse, PublicProjectResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicProjectsInit = {
  next: {
    revalidate: 60,
    tags: ['projects:list'],
  },
} as RequestInit

function publicProjectInit(slug: string) {
  return {
    next: {
      revalidate: 60,
      tags: [`project:${slug}`],
    },
  } as RequestInit
}

export function getPublicProjects(
  filters: { page?: number; pageSize?: number } = {},
): Promise<ApiResponse<PublicProjectListResponse>> {
  return http.get<PublicProjectListResponse>('/rpc/bobo/projects', {
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
    },
    init: publicProjectsInit,
  })
}

export function getPublicProject(slug: string): Promise<ApiResponse<PublicProjectResponse>> {
  return http.get<PublicProjectResponse>(`/rpc/bobo/projects/${encodeURIComponent(slug)}`, {
    init: publicProjectInit(slug),
  })
}

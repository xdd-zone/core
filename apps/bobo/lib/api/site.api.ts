import type { ApiResponse, SiteConfigResponse } from '@xdd-zone/contracts'
import { http } from '@/lib/http'

const publicSiteInit = {
  next: {
    revalidate: 60,
    tags: ['site:config'],
  },
} as RequestInit

export function getPublicSiteConfig(): Promise<ApiResponse<SiteConfigResponse>> {
  return http.get<SiteConfigResponse>('/rpc/bobo/site/config', {
    init: publicSiteInit,
  })
}

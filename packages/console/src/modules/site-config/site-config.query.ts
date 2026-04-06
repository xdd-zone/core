import type { UpdateSiteConfigBody } from './site-config.types'

import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

const siteConfigApiRoot = api['site-config']

export const SITE_CONFIG_QUERY_KEY = ['site-config'] as const

/**
 * 站点配置查询配置。
 */
export function siteConfigQueryOptions() {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await siteConfigApiRoot.get()),
    queryKey: SITE_CONFIG_QUERY_KEY,
    staleTime: 30_000,
  })
}

/**
 * 站点配置查询 Hook。
 */
export function useSiteConfigQuery(enabled: boolean = true) {
  return useQuery({
    ...siteConfigQueryOptions(),
    enabled,
  })
}

/**
 * 更新站点配置 mutation。
 */
export function useUpdateSiteConfigMutation() {
  return useMutation({
    mutationFn: async (body: UpdateSiteConfigBody) => unwrapEdenResponse(await siteConfigApiRoot.put(body)),
  })
}

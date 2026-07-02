import type { UpdateSiteConfigRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSiteConfig, updateSiteConfig } from './site.api'

export const siteQueryKeys = {
  all: ['site'] as const,
  config: () => [...siteQueryKeys.all, 'config'] as const,
}

export function useSiteConfigQuery() {
  return useQuery({
    queryKey: siteQueryKeys.config(),
    queryFn: getSiteConfig,
  })
}

export function useUpdateSiteConfigMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateSiteConfigRequest) => updateSiteConfig(payload),
    onSuccess: async (response) => {
      if (response.ok) {
        await queryClient.setQueryData(siteQueryKeys.config(), response)
      }

      await queryClient.invalidateQueries({ queryKey: siteQueryKeys.config() })
    },
  })
}

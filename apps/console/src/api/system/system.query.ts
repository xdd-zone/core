import type { PingRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSystemHealth } from './health.api'
import { pingSystem } from './ping.api'

export const systemQueryKeys = {
  all: ['system'] as const,
  health: () => [...systemQueryKeys.all, 'health'] as const,
}

export function useSystemHealthQuery() {
  return useQuery({
    queryKey: systemQueryKeys.health(),
    queryFn: getSystemHealth,
  })
}

export function usePingSystemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PingRequest) => pingSystem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: systemQueryKeys.health(),
      })
    },
  })
}

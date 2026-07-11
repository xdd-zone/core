import type { PingRequest, SystemLogListQuery } from '@xdd-zone/contracts'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSystemHealth } from './health.api'
import { getSystemLogs } from './logs.api'
import { pingSystem } from './ping.api'
import { getSystemReadiness } from './readiness.api'

export const systemQueryKeys = {
  all: ['system'] as const,
  health: () => [...systemQueryKeys.all, 'health'] as const,
  logs: () => [...systemQueryKeys.all, 'logs'] as const,
  logsList: (query: Omit<SystemLogListQuery, 'cursor'>) => [...systemQueryKeys.logs(), query] as const,
  readiness: () => [...systemQueryKeys.all, 'readiness'] as const,
}

export function useSystemHealthQuery() {
  return useQuery({
    queryKey: systemQueryKeys.health(),
    queryFn: getSystemHealth,
  })
}

export function useSystemReadinessQuery() {
  return useQuery({
    queryKey: systemQueryKeys.readiness(),
    queryFn: getSystemReadiness,
  })
}

export function useSystemLogsInfiniteQuery(query: Omit<SystemLogListQuery, 'cursor'>, enabled: boolean) {
  return useInfiniteQuery({
    enabled,
    getNextPageParam: (lastPage: Awaited<ReturnType<typeof getSystemLogs>>) =>
      lastPage.ok ? (lastPage.data.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getSystemLogs({ ...query, cursor: pageParam }),
    queryKey: systemQueryKeys.logsList(query),
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

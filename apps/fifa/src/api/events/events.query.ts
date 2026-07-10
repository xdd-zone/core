import type { EventOutboxListQuery } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { contentQueryKeys } from '../content'
import { projectQueryKeys } from '../projects'
import { getEventOutbox, listEventsOutbox, retryEventOutbox, retryEventsOutbox } from './events.api'

export const eventsQueryKeys = {
  all: ['events'] as const,
  outbox: () => [...eventsQueryKeys.all, 'outbox'] as const,
  outboxDetail: (eventId: string) => [...eventsQueryKeys.outbox(), eventId] as const,
  outboxList: (query: EventOutboxListQuery) => [...eventsQueryKeys.outbox(), 'list', query] as const,
}

export function useEventOutboxQuery(eventId: string) {
  return useQuery({
    enabled: !!eventId,
    queryKey: eventsQueryKeys.outboxDetail(eventId),
    queryFn: () => getEventOutbox(eventId),
  })
}

export function useEventsOutboxQuery(query: EventOutboxListQuery) {
  return useQuery({
    queryKey: eventsQueryKeys.outboxList(query),
    queryFn: () => listEventsOutbox(query),
  })
}

export function useRetryEventOutboxMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => retryEventOutbox(eventId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventsQueryKeys.outbox() }),
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() }),
      ])
    },
  })
}

export function useRetryEventsOutboxMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryEventsOutbox,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventsQueryKeys.outbox() }),
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() }),
      ])
    },
  })
}

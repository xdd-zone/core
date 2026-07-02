import { useMutation, useQueryClient } from '@tanstack/react-query'

import { contentQueryKeys } from '../content'
import { projectQueryKeys } from '../projects'
import { retryEventsOutbox } from './events.api'

export function useRetryEventsOutboxMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryEventsOutbox,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() }),
      ])
    },
  })
}

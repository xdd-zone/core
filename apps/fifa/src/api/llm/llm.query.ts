import type { LlmUseCase, UpdateLlmUseCaseConfigRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { listLlmUseCaseConfigs, updateLlmUseCaseConfig } from './llm.api'

export const llmQueryKeys = {
  all: ['llm'] as const,
  configs: () => [...llmQueryKeys.all, 'use-cases'] as const,
}

export function useLlmUseCaseConfigsQuery() {
  return useQuery({
    queryKey: llmQueryKeys.configs(),
    queryFn: listLlmUseCaseConfigs,
  })
}

export function useUpdateLlmUseCaseConfigMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { payload: UpdateLlmUseCaseConfigRequest; useCase: LlmUseCase }) =>
      updateLlmUseCaseConfig(input.useCase, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.configs() })
    },
  })
}

import type {
  CreateLlmProviderRequest,
  LlmCallLogListQuery,
  LlmUseCase,
  UpdateLlmProviderRequest,
  UpdateLlmUseCaseConfigRequest,
} from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createLlmProvider,
  deleteExpiredLlmCallLogs,
  deleteLlmProviderApiKey,
  getLlmCallLog,
  getLlmUseCaseStatus,
  listLlmCallLogs,
  listLlmProviders,
  listLlmUseCaseConfigs,
  testLlmProvider,
  testLlmUseCase,
  updateLlmProvider,
  updateLlmUseCaseConfig,
} from './llm.api'

export const llmQueryKeys = {
  all: ['llm'] as const,
  callLog: (logId: string) => [...llmQueryKeys.callLogs(), logId] as const,
  callLogs: () => [...llmQueryKeys.all, 'call-logs'] as const,
  callLogsList: (query: LlmCallLogListQuery) => [...llmQueryKeys.callLogs(), 'list', query] as const,
  configs: () => [...llmQueryKeys.all, 'use-cases'] as const,
  providers: () => [...llmQueryKeys.all, 'providers'] as const,
  useCaseStatus: (useCase: LlmUseCase) => [...llmQueryKeys.configs(), useCase, 'status'] as const,
}

export function useLlmProvidersQuery() {
  return useQuery({
    queryKey: llmQueryKeys.providers(),
    queryFn: listLlmProviders,
  })
}

export function useCreateLlmProviderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLlmProviderRequest) => createLlmProvider(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.providers() })
    },
  })
}

export function useUpdateLlmProviderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { payload: UpdateLlmProviderRequest; providerId: string }) =>
      updateLlmProvider(input.providerId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.providers() })
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.configs() })
    },
  })
}

export function useDeleteLlmProviderApiKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (providerId: string) => deleteLlmProviderApiKey(providerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.providers() })
    },
  })
}

export function useTestLlmProviderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (providerId: string) => testLlmProvider(providerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.callLogs() })
    },
  })
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
    onSuccess: async (_response, input) => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.configs() })
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.useCaseStatus(input.useCase) })
    },
  })
}

export function useLlmUseCaseStatusQuery(useCase: LlmUseCase) {
  return useQuery({
    queryKey: llmQueryKeys.useCaseStatus(useCase),
    queryFn: () => getLlmUseCaseStatus(useCase),
  })
}

export function useTestLlmUseCaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (useCase: LlmUseCase) => testLlmUseCase(useCase),
    onSuccess: async (_response, useCase) => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.callLogs() })
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.useCaseStatus(useCase) })
    },
  })
}

export function useLlmCallLogsQuery(query: LlmCallLogListQuery) {
  return useQuery({
    queryKey: llmQueryKeys.callLogsList(query),
    queryFn: () => listLlmCallLogs(query),
  })
}

export function useLlmCallLogQuery(logId: string) {
  return useQuery({
    enabled: !!logId,
    queryKey: llmQueryKeys.callLog(logId),
    queryFn: () => getLlmCallLog(logId),
  })
}

export function useDeleteExpiredLlmCallLogsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteExpiredLlmCallLogs(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmQueryKeys.callLogs() })
    },
  })
}

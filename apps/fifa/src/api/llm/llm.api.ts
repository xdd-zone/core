import type {
  CreateLlmProviderRequest,
  DeleteExpiredLlmCallLogsResponse,
  LlmCallLogListQuery,
  LlmCallLogListResponse,
  LlmCallLogResponse,
  LlmProviderListResponse,
  LlmProviderResponse,
  LlmUseCase,
  LlmUseCaseConfigListResponse,
  LlmUseCaseConfigResponse,
  TestLlmProviderResponse,
  UpdateLlmProviderRequest,
  UpdateLlmUseCaseConfigRequest,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function listLlmProviders() {
  return readMomoJson<LlmProviderListResponse>(momoClient.rpc.llm.providers.$get())
}

export function createLlmProvider(payload: CreateLlmProviderRequest) {
  return readMomoJson<LlmProviderResponse>(
    momoClient.rpc.llm.providers.$post({
      json: payload,
    }),
  )
}

export function updateLlmProvider(providerId: string, payload: UpdateLlmProviderRequest) {
  return readMomoJson<LlmProviderResponse>(
    momoClient.rpc.llm.providers[':providerId'].$patch({
      json: payload,
      param: { providerId },
    }),
  )
}

export function deleteLlmProviderApiKey(providerId: string) {
  return readMomoJson<LlmProviderResponse>(
    momoClient.rpc.llm.providers[':providerId']['api-key'].$delete({
      param: { providerId },
    }),
  )
}

export function testLlmProvider(providerId: string) {
  return readMomoJson<TestLlmProviderResponse>(
    momoClient.rpc.llm.providers[':providerId'].test.$post({
      param: { providerId },
    }),
  )
}

export function listLlmUseCaseConfigs() {
  return readMomoJson<LlmUseCaseConfigListResponse>(momoClient.rpc.llm['use-cases'].$get())
}

export function updateLlmUseCaseConfig(useCase: LlmUseCase, payload: UpdateLlmUseCaseConfigRequest) {
  return readMomoJson<LlmUseCaseConfigResponse>(
    momoClient.rpc.llm['use-cases'][':useCase'].$patch({
      json: payload,
      param: {
        useCase,
      },
    }),
  )
}

export function listLlmCallLogs(query: LlmCallLogListQuery) {
  return readMomoJson<LlmCallLogListResponse>(
    momoClient.rpc.llm['call-logs'].$get({
      query: {
        ...query,
        page: query.page.toString(),
        pageSize: query.pageSize.toString(),
      },
    }),
  )
}

export function getLlmCallLog(logId: string) {
  return readMomoJson<LlmCallLogResponse>(
    momoClient.rpc.llm['call-logs'][':logId'].$get({
      param: { logId },
    }),
  )
}

export function deleteExpiredLlmCallLogs() {
  return readMomoJson<DeleteExpiredLlmCallLogsResponse>(momoClient.rpc.llm['call-logs'].expired.$delete())
}

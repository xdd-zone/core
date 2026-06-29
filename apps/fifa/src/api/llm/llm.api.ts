import type {
  LlmUseCase,
  LlmUseCaseConfigListResponse,
  LlmUseCaseConfigResponse,
  UpdateLlmUseCaseConfigRequest,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

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

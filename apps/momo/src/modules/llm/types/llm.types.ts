import type { LlmApiFormat, LlmProvider, LlmUseCase } from '@xdd-zone/contracts'
import type { MomoEnv } from '#momo/shared/env'

export interface ResolvedLlmUseCaseConfig {
  apiFormat: LlmApiFormat
  baseUrl?: string
  enabled: boolean
  maxOutputTokens?: number
  model: string
  provider: LlmProvider
  temperature?: number
  timeoutMs: number
  useCase: LlmUseCase
}

export function createDefaultLlmUseCaseConfig(env: MomoEnv, useCase: LlmUseCase): ResolvedLlmUseCaseConfig {
  return {
    apiFormat: env.OPENAI_API_FORMAT,
    baseUrl: env.OPENAI_BASE_URL,
    enabled: env.LLM_PROVIDER !== 'none',
    model: env.OPENAI_MODEL,
    provider: env.LLM_PROVIDER,
    timeoutMs: env.OPENAI_TIMEOUT_MS,
    useCase,
  }
}

export type { LlmUseCase }

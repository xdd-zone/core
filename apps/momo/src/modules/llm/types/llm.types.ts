import type { LlmApiFormat, LlmProviderType, LlmUseCase } from '@xdd-zone/contracts'

export interface ResolvedLlmProviderConfig {
  apiFormat: LlmApiFormat
  apiKeyCiphertext: string | null
  baseUrl: string
  defaultModel: string
  enabled: boolean
  id: string
  name: string
  providerType: LlmProviderType
  timeoutMs: number
}

export interface ResolvedLlmUseCaseConfig {
  enabled: boolean
  maxOutputTokens?: number
  model: string
  provider: ResolvedLlmProviderConfig | null
  providerId?: string
  temperature?: number
  useCase: LlmUseCase
}

export function createDefaultLlmUseCaseConfig(useCase: LlmUseCase): ResolvedLlmUseCaseConfig {
  return {
    enabled: false,
    model: 'gpt-5-mini',
    provider: null,
    useCase,
  }
}

export type { LlmUseCase }

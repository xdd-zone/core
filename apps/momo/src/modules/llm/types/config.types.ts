import type {
  CreateLlmProviderRequest,
  LlmCallLogListQuery,
  LlmCallOperation,
  LlmCallStatus,
  LlmProviderType,
  LlmUseCase,
  UpdateLlmProviderRequest,
} from '@xdd-zone/contracts'
import type { InferSelectModel } from 'drizzle-orm'
import type { llmCallLogs, llmProviders, llmUseCaseConfigs } from '#momo/infra/db/schema/index'

export type LlmProviderRecord = InferSelectModel<typeof llmProviders>
export type LlmUseCaseConfigRecord = InferSelectModel<typeof llmUseCaseConfigs>
export type LlmCallLogRecord = InferSelectModel<typeof llmCallLogs>

export interface LlmUseCaseConfigWithProvider {
  config: LlmUseCaseConfigRecord
  provider: LlmProviderRecord | null
}

export interface UpsertLlmUseCaseConfigInput {
  enabled: boolean
  maxOutputTokens: number | null
  model: string
  providerId: string | null
  temperature: number | null
  useCase: LlmUseCase
}

export interface CreateLlmProviderInput extends CreateLlmProviderRequest {
  apiKeyCiphertext: string | null
  apiKeyHint: string | null
}

export interface UpdateLlmProviderInput extends UpdateLlmProviderRequest {
  apiKeyCiphertext?: string
  apiKeyHint?: string
}

export interface CreateLlmCallLogInput {
  actorId?: string | null
  durationMs?: number | null
  endedAt?: Date | null
  errorCode?: string | null
  errorDetails?: Record<string, unknown> | null
  errorMessage?: string | null
  errorStatus?: number | null
  errorType?: string | null
  expiresAt: Date
  inputTokens?: number | null
  model: string
  operation: LlmCallOperation
  outputTokens?: number | null
  providerApiFormat: LlmProviderRecord['apiFormat']
  providerBaseUrl: string
  providerId?: string | null
  providerName: string
  providerType: LlmProviderType
  requestId?: string | null
  sourceId?: string | null
  sourceType?: string | null
  startedAt: Date
  status: LlmCallStatus
  totalTokens?: number | null
  useCase?: LlmUseCase | null
}

export type ListLlmCallLogsInput = LlmCallLogListQuery

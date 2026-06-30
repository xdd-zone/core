import type { LlmCallLog, LlmProvider, LlmUseCaseConfig } from '@xdd-zone/contracts'
import type { LlmProviderRecord, LlmUseCaseConfigWithProvider } from './types/config.types'
import { LlmCallLogSchema, LlmProviderSchema, LlmUseCaseConfigSchema } from '@xdd-zone/contracts'

export function toLlmProvider(record: LlmProviderRecord): LlmProvider {
  return LlmProviderSchema.parse({
    apiFormat: record.apiFormat,
    apiKeyHint: record.apiKeyHint,
    baseUrl: record.baseUrl,
    createdAt: record.createdAt.toISOString(),
    defaultModel: record.defaultModel,
    enabled: record.enabled === 1,
    hasApiKey: Boolean(record.apiKeyCiphertext),
    id: record.id,
    name: record.name,
    providerType: record.providerType,
    timeoutMs: record.timeoutMs,
    updatedAt: record.updatedAt.toISOString(),
  })
}

export function toLlmUseCaseConfig(row: LlmUseCaseConfigWithProvider): LlmUseCaseConfig {
  return LlmUseCaseConfigSchema.parse({
    createdAt: row.config.createdAt.toISOString(),
    enabled: row.config.enabled === 1,
    id: row.config.id,
    maxOutputTokens: row.config.maxOutputTokens,
    model: row.config.model,
    provider: row.provider ? toLlmProvider(row.provider) : null,
    providerId: row.config.providerId,
    temperature: row.config.temperature === null ? null : Number(row.config.temperature),
    updatedAt: row.config.updatedAt.toISOString(),
    useCase: row.config.useCase,
  })
}

export function toLlmCallLog(row: {
  log: {
    actorId: string | null
    durationMs: number | null
    endedAt: Date | null
    errorCode: string | null
    errorMessage: string | null
    errorStatus: number | null
    errorType: string | null
    id: string
    inputTokens: number | null
    model: string
    operation: 'provider.test' | 'content.post.meta'
    outputTokens: number | null
    providerApiFormat: 'chat_completions' | 'responses'
    providerBaseUrl: string
    providerId: string | null
    providerName: string
    providerType: 'openai'
    requestId: string | null
    sourceId: string | null
    sourceType: string | null
    startedAt: Date
    status: 'success' | 'error'
    totalTokens: number | null
    useCase: 'content.post.meta' | null
  }
  provider: LlmProviderRecord | null
}): LlmCallLog {
  return LlmCallLogSchema.parse({
    actorId: row.log.actorId,
    durationMs: row.log.durationMs,
    endedAt: row.log.endedAt?.toISOString() ?? null,
    errorCode: row.log.errorCode,
    errorMessage: row.log.errorMessage,
    errorStatus: row.log.errorStatus,
    errorType: row.log.errorType,
    id: row.log.id,
    inputTokens: row.log.inputTokens,
    model: row.log.model,
    operation: row.log.operation,
    outputTokens: row.log.outputTokens,
    providerApiFormat: row.log.providerApiFormat,
    providerBaseUrl: row.log.providerBaseUrl,
    providerCurrentEnabled: row.provider ? row.provider.enabled === 1 : null,
    providerCurrentExists: Boolean(row.provider),
    providerId: row.log.providerId,
    providerName: row.log.providerName,
    providerType: row.log.providerType,
    requestId: row.log.requestId,
    sourceId: row.log.sourceId,
    sourceType: row.log.sourceType,
    startedAt: row.log.startedAt.toISOString(),
    status: row.log.status,
    totalTokens: row.log.totalTokens,
    useCase: row.log.useCase,
  })
}

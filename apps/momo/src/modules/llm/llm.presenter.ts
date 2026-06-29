import type { LlmUseCaseConfig } from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { LlmUseCaseConfigRecord } from './types/config.types'
import { LlmUseCaseConfigSchema } from '@xdd-zone/contracts'

export function toLlmUseCaseConfig(record: LlmUseCaseConfigRecord, runtime: MomoRuntime): LlmUseCaseConfig {
  return LlmUseCaseConfigSchema.parse({
    apiFormat: record.apiFormat,
    baseUrl: record.baseUrl,
    createdAt: record.createdAt.toISOString(),
    enabled: record.enabled === 1,
    hasApiKey: Boolean(runtime.env.OPENAI_API_KEY),
    id: record.id,
    maxOutputTokens: record.maxOutputTokens,
    model: record.model,
    provider: record.provider,
    temperature: record.temperature === null ? null : Number(record.temperature),
    timeoutMs: record.timeoutMs,
    updatedAt: record.updatedAt.toISOString(),
    useCase: record.useCase,
  })
}

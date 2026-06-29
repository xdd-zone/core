import type { LlmApiFormat, LlmProvider, LlmUseCase } from '@xdd-zone/contracts'
import type { InferSelectModel } from 'drizzle-orm'
import type { llmUseCaseConfigs } from '#momo/infra/db/schema/index'

export type LlmUseCaseConfigRecord = InferSelectModel<typeof llmUseCaseConfigs>

export interface UpsertLlmUseCaseConfigInput {
  apiFormat: LlmApiFormat
  baseUrl: string | null
  enabled: boolean
  maxOutputTokens: number | null
  model: string
  provider: LlmProvider
  temperature: number | null
  timeoutMs: number
  useCase: LlmUseCase
}

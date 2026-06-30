import { z } from 'zod'

export const LLM_USE_CASE_VALUES = ['content.post.meta'] as const
export const LLM_PROVIDER_TYPE_VALUES = ['openai'] as const
export const LLM_API_FORMAT_VALUES = ['chat_completions', 'responses'] as const
export const LLM_CALL_OPERATION_VALUES = ['provider.test', 'content.post.meta'] as const
export const LLM_CALL_STATUS_VALUES = ['success', 'error'] as const

export const LlmUseCaseSchema = z.enum(LLM_USE_CASE_VALUES)
export const LlmProviderTypeSchema = z.enum(LLM_PROVIDER_TYPE_VALUES)
export const LlmApiFormatSchema = z.enum(LLM_API_FORMAT_VALUES)
export const LlmCallOperationSchema = z.enum(LLM_CALL_OPERATION_VALUES)
export const LlmCallStatusSchema = z.enum(LLM_CALL_STATUS_VALUES)

export const LlmProviderSchema = z.object({
  apiFormat: LlmApiFormatSchema,
  apiKeyHint: z.string().nullable(),
  baseUrl: z.string().url(),
  createdAt: z.string(),
  defaultModel: z.string(),
  enabled: z.boolean(),
  hasApiKey: z.boolean(),
  id: z.string(),
  name: z.string(),
  providerType: LlmProviderTypeSchema,
  timeoutMs: z.number().int().positive(),
  updatedAt: z.string(),
})

export const CreateLlmProviderRequestSchema = z.object({
  apiFormat: LlmApiFormatSchema.default('chat_completions'),
  apiKey: z.string().trim().min(1).optional(),
  baseUrl: z.string().url(),
  defaultModel: z.string().trim().min(1).max(120),
  enabled: z.boolean().default(false),
  name: z.string().trim().min(1).max(80),
  providerType: LlmProviderTypeSchema.default('openai'),
  timeoutMs: z.number().int().positive().max(120000).default(15000),
})

export const UpdateLlmProviderRequestSchema = z.object({
  apiFormat: LlmApiFormatSchema.optional(),
  apiKey: z.string().trim().min(1).optional(),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().trim().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  name: z.string().trim().min(1).max(80).optional(),
  timeoutMs: z.number().int().positive().max(120000).optional(),
})

export const LlmProviderResponseSchema = z.object({
  provider: LlmProviderSchema,
})

export const LlmProviderListResponseSchema = z.object({
  providers: z.array(LlmProviderSchema),
})

export const LlmUseCaseConfigSchema = z.object({
  createdAt: z.string(),
  enabled: z.boolean(),
  id: z.string(),
  maxOutputTokens: z.number().int().positive().nullable(),
  model: z.string(),
  provider: LlmProviderSchema.nullable(),
  providerId: z.string().nullable(),
  temperature: z.number().min(0).max(2).nullable(),
  updatedAt: z.string(),
  useCase: LlmUseCaseSchema,
})

export const UpdateLlmUseCaseConfigRequestSchema = z.object({
  enabled: z.boolean().optional(),
  maxOutputTokens: z.number().int().positive().max(128000).nullable().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  providerId: z.string().trim().min(1).nullable().optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
})

export const LlmUseCaseConfigResponseSchema = z.object({
  config: LlmUseCaseConfigSchema,
})

export const LlmUseCaseConfigListResponseSchema = z.object({
  configs: z.array(LlmUseCaseConfigSchema),
})

const LlmUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
})

export const TestLlmProviderResponseSchema = z.object({
  logId: z.string(),
  status: LlmCallStatusSchema,
  usage: LlmUsageSchema.optional(),
})

export const LlmCallLogSchema = z.object({
  actorId: z.string().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  endedAt: z.string().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  errorStatus: z.number().int().nullable(),
  errorType: z.string().nullable(),
  id: z.string(),
  inputTokens: z.number().int().nonnegative().nullable(),
  model: z.string(),
  operation: LlmCallOperationSchema,
  outputTokens: z.number().int().nonnegative().nullable(),
  providerApiFormat: LlmApiFormatSchema,
  providerBaseUrl: z.string(),
  providerCurrentEnabled: z.boolean().nullable(),
  providerCurrentExists: z.boolean().optional(),
  providerId: z.string().nullable(),
  providerName: z.string(),
  providerType: LlmProviderTypeSchema,
  requestId: z.string().nullable(),
  sourceId: z.string().nullable(),
  sourceType: z.string().nullable(),
  startedAt: z.string(),
  status: LlmCallStatusSchema,
  totalTokens: z.number().int().nonnegative().nullable(),
  useCase: LlmUseCaseSchema.nullable(),
})

export const LlmCallLogListQuerySchema = z.object({
  model: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  providerId: z.string().trim().min(1).optional(),
  requestId: z.string().trim().min(1).optional(),
  startedAtFrom: z.string().datetime().optional(),
  startedAtTo: z.string().datetime().optional(),
  status: LlmCallStatusSchema.optional(),
  useCase: LlmUseCaseSchema.optional(),
})

export const LlmCallLogListResponseSchema = z.object({
  logs: z.array(LlmCallLogSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const LlmCallLogResponseSchema = z.object({
  log: LlmCallLogSchema,
})

export const DeleteExpiredLlmCallLogsResponseSchema = z.object({
  deleted: z.number().int().nonnegative(),
})

export type LlmUseCase = z.infer<typeof LlmUseCaseSchema>
export type LlmProviderType = z.infer<typeof LlmProviderTypeSchema>
export type LlmApiFormat = z.infer<typeof LlmApiFormatSchema>
export type LlmCallOperation = z.infer<typeof LlmCallOperationSchema>
export type LlmCallStatus = z.infer<typeof LlmCallStatusSchema>
export type LlmProvider = z.infer<typeof LlmProviderSchema>
export type CreateLlmProviderRequest = z.infer<typeof CreateLlmProviderRequestSchema>
export type UpdateLlmProviderRequest = z.infer<typeof UpdateLlmProviderRequestSchema>
export type LlmProviderResponse = z.infer<typeof LlmProviderResponseSchema>
export type LlmProviderListResponse = z.infer<typeof LlmProviderListResponseSchema>
export type LlmUseCaseConfig = z.infer<typeof LlmUseCaseConfigSchema>
export type UpdateLlmUseCaseConfigRequest = z.infer<typeof UpdateLlmUseCaseConfigRequestSchema>
export type LlmUseCaseConfigResponse = z.infer<typeof LlmUseCaseConfigResponseSchema>
export type LlmUseCaseConfigListResponse = z.infer<typeof LlmUseCaseConfigListResponseSchema>
export type TestLlmProviderResponse = z.infer<typeof TestLlmProviderResponseSchema>
export type LlmCallLog = z.infer<typeof LlmCallLogSchema>
export type LlmCallLogListQuery = z.infer<typeof LlmCallLogListQuerySchema>
export type LlmCallLogListResponse = z.infer<typeof LlmCallLogListResponseSchema>
export type LlmCallLogResponse = z.infer<typeof LlmCallLogResponseSchema>
export type DeleteExpiredLlmCallLogsResponse = z.infer<typeof DeleteExpiredLlmCallLogsResponseSchema>

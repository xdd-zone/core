import { z } from 'zod'

export const LLM_USE_CASE_VALUES = ['content.post.meta'] as const
export const LLM_PROVIDER_VALUES = ['none', 'openai'] as const
export const LLM_API_FORMAT_VALUES = ['chat_completions', 'responses'] as const

export const LlmUseCaseSchema = z.enum(LLM_USE_CASE_VALUES)
export const LlmProviderSchema = z.enum(LLM_PROVIDER_VALUES)
export const LlmApiFormatSchema = z.enum(LLM_API_FORMAT_VALUES)

export const LlmUseCaseConfigSchema = z.object({
  apiFormat: LlmApiFormatSchema,
  baseUrl: z.string().nullable(),
  createdAt: z.string(),
  enabled: z.boolean(),
  hasApiKey: z.boolean(),
  id: z.string(),
  maxOutputTokens: z.number().int().positive().nullable(),
  model: z.string(),
  provider: LlmProviderSchema,
  temperature: z.number().min(0).max(2).nullable(),
  timeoutMs: z.number().int().positive(),
  updatedAt: z.string(),
  useCase: LlmUseCaseSchema,
})

export const UpdateLlmUseCaseConfigRequestSchema = z.object({
  apiFormat: LlmApiFormatSchema.optional(),
  baseUrl: z.string().url().nullable().optional(),
  enabled: z.boolean().optional(),
  maxOutputTokens: z.number().int().positive().max(128000).nullable().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  provider: LlmProviderSchema.optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  timeoutMs: z.number().int().positive().max(120000).optional(),
})

export const LlmUseCaseConfigResponseSchema = z.object({
  config: LlmUseCaseConfigSchema,
})

export const LlmUseCaseConfigListResponseSchema = z.object({
  configs: z.array(LlmUseCaseConfigSchema),
})

export type LlmUseCase = z.infer<typeof LlmUseCaseSchema>
export type LlmProvider = z.infer<typeof LlmProviderSchema>
export type LlmApiFormat = z.infer<typeof LlmApiFormatSchema>
export type LlmUseCaseConfig = z.infer<typeof LlmUseCaseConfigSchema>
export type UpdateLlmUseCaseConfigRequest = z.infer<typeof UpdateLlmUseCaseConfigRequestSchema>
export type LlmUseCaseConfigResponse = z.infer<typeof LlmUseCaseConfigResponseSchema>
export type LlmUseCaseConfigListResponse = z.infer<typeof LlmUseCaseConfigListResponseSchema>

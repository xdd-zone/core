import type {
  GeneratePostMetaRequest,
  GeneratePostMetaResponse,
  LlmUseCase,
  LlmUseCaseConfig,
  LlmUseCaseConfigListResponse,
  LlmUseCaseConfigResponse,
  UpdateLlmUseCaseConfigRequest,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { LlmDriver } from '#momo/infra/llm'
import type { LlmConfigRepository } from '../repositories/llm-config.repository'
import type { ResolvedLlmUseCaseConfig } from '../types/llm.types'
import { BizCode, LLM_USE_CASE_VALUES } from '@xdd-zone/contracts'
import { z } from 'zod'
import { OpenAILlm } from '#momo/infra/llm'
import { AppError } from '#momo/shared/app-error'

import { toLlmUseCaseConfig } from '../llm.presenter'
import { createDefaultLlmUseCaseConfig } from '../types/llm.types'

const POST_META_SOURCE_LIMIT = 4000
const DEFAULT_USE_CASE: LlmUseCase = 'content.post.meta'

const postMetaOutputSchema = z.object({
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
})

const postMetaJsonSchema = {
  additionalProperties: false,
  properties: {
    excerpt: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
  },
  required: [],
  type: 'object',
}

type LlmDriverFactory = (config: ResolvedLlmUseCaseConfig) => LlmDriver

export function createLlmService(
  runtime: MomoRuntime,
  repository?: LlmConfigRepository,
  driverFactory?: LlmDriverFactory,
) {
  async function listUseCaseConfigs(): Promise<LlmUseCaseConfigListResponse> {
    const records = repository ? await repository.listConfigs() : []
    const byUseCase = new Map(records.map((record) => [record.useCase, record]))

    return {
      configs: LLM_USE_CASE_VALUES.map((useCase) => {
        const record = byUseCase.get(useCase)

        if (record) {
          return toLlmUseCaseConfig(record, runtime)
        }

        return toDefaultUseCaseConfig(useCase)
      }),
    }
  }

  async function updateUseCaseConfig(
    useCase: LlmUseCase,
    input: UpdateLlmUseCaseConfigRequest,
  ): Promise<LlmUseCaseConfigResponse> {
    if (!repository) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 配置仓库未启用', 409)
    }

    const current = await resolveUseCaseConfig(useCase)
    const next: ResolvedLlmUseCaseConfig = {
      ...current,
      apiFormat: input.apiFormat ?? current.apiFormat,
      baseUrl: input.baseUrl === undefined ? current.baseUrl : (input.baseUrl ?? undefined),
      enabled: input.enabled ?? current.enabled,
      maxOutputTokens:
        input.maxOutputTokens === undefined ? current.maxOutputTokens : (input.maxOutputTokens ?? undefined),
      model: input.model?.trim() ?? current.model,
      provider: input.provider ?? current.provider,
      temperature: input.temperature === undefined ? current.temperature : (input.temperature ?? undefined),
      timeoutMs: input.timeoutMs ?? current.timeoutMs,
    }

    const record = await repository.upsertConfig({
      apiFormat: next.apiFormat,
      baseUrl: next.baseUrl ?? null,
      enabled: next.enabled,
      maxOutputTokens: next.maxOutputTokens ?? null,
      model: next.model,
      provider: next.provider,
      temperature: next.temperature ?? null,
      timeoutMs: next.timeoutMs,
      useCase,
    })

    return {
      config: toLlmUseCaseConfig(record, runtime),
    }
  }

  async function generatePostMetaSuggestion(input: GeneratePostMetaRequest): Promise<GeneratePostMetaResponse> {
    const config = await resolveUseCaseConfig(DEFAULT_USE_CASE)
    const driver = driverFactory ? driverFactory(config) : createDriverForUseCase(config)
    const result = await driver.generateStructuredJson({
      maxOutputTokens: config.maxOutputTokens,
      responseFormat: {
        name: 'post_meta_suggestion',
        schema: postMetaJsonSchema,
      },
      systemPrompt: getPostMetaSystemPrompt(),
      temperature: config.temperature,
      userPrompt: getPostMetaUserPrompt(input),
    })

    const parsed = postMetaOutputSchema.safeParse(result.data)
    if (!parsed.success) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 返回的文章字段建议格式不正确', 409, {
        issues: parsed.error.issues,
      })
    }

    return {
      suggestion: parsed.data,
      usage: result.usage,
    }
  }

  return {
    generatePostMetaSuggestion,
    listUseCaseConfigs,
    updateUseCaseConfig,
  }

  async function resolveUseCaseConfig(useCase: LlmUseCase): Promise<ResolvedLlmUseCaseConfig> {
    const record = repository ? await repository.findConfigByUseCase(useCase) : null

    if (!record) {
      return createDefaultLlmUseCaseConfig(runtime.env, useCase)
    }

    return {
      apiFormat: record.apiFormat,
      baseUrl: record.baseUrl ?? undefined,
      enabled: record.enabled === 1,
      maxOutputTokens: record.maxOutputTokens ?? undefined,
      model: record.model,
      provider: record.provider,
      temperature: record.temperature === null ? undefined : Number(record.temperature),
      timeoutMs: record.timeoutMs,
      useCase,
    }
  }

  function createDriverForUseCase(config: ResolvedLlmUseCaseConfig): LlmDriver {
    if (!config.enabled || config.provider === 'none') {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 用例未启用', 409)
    }

    if (config.provider === 'openai') {
      if (!runtime.env.OPENAI_API_KEY) {
        throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM_PROVIDER=openai 时，OPENAI_API_KEY 必须配置', 409)
      }

      return new OpenAILlm({
        apiKey: runtime.env.OPENAI_API_KEY,
        apiFormat: config.apiFormat,
        baseURL: config.baseUrl,
        model: config.model,
        timeout: config.timeoutMs,
      })
    }

    return runtime.llm
  }

  function toDefaultUseCaseConfig(useCase: LlmUseCase): LlmUseCaseConfig {
    const config = createDefaultLlmUseCaseConfig(runtime.env, useCase)
    const now = new Date(0).toISOString()

    return {
      apiFormat: config.apiFormat,
      baseUrl: config.baseUrl ?? null,
      createdAt: now,
      enabled: config.enabled,
      hasApiKey: Boolean(runtime.env.OPENAI_API_KEY),
      id: `default_${useCase}`,
      maxOutputTokens: config.maxOutputTokens ?? null,
      model: config.model,
      provider: config.provider,
      temperature: config.temperature ?? null,
      timeoutMs: config.timeoutMs,
      updatedAt: now,
      useCase,
    }
  }
}

export function getPostMetaSystemPrompt(): string {
  return '你是文章编辑助手。只返回 JSON。slug 必须使用小写英文、数字和连字符。摘要要直接描述文章内容，不写营销话。'
}

export function getPostMetaUserPrompt(input: GeneratePostMetaRequest): string {
  return JSON.stringify({
    excerpt: input.excerpt ?? null,
    locale: input.locale,
    mode: input.mode,
    slug: input.slug,
    source: input.source ? input.source.slice(0, POST_META_SOURCE_LIMIT) : undefined,
    targets: input.targets,
    title: input.title,
  })
}

export type LlmService = ReturnType<typeof createLlmService>

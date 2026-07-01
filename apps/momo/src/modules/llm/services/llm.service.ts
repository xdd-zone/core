import type {
  CreateLlmProviderRequest,
  GeneratePostMetaRequest,
  GeneratePostMetaResponse,
  LlmCallLogListQuery,
  LlmCallLogListResponse,
  LlmCallLogResponse,
  LlmProviderListResponse,
  LlmProviderResponse,
  LlmUseCase,
  LlmUseCaseConfig,
  LlmUseCaseConfigListResponse,
  LlmUseCaseConfigResponse,
  TestLlmProviderResponse,
  UpdateLlmProviderRequest,
  UpdateLlmUseCaseConfigRequest,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { GenerateStructuredJsonResponse, LlmDriver } from '#momo/infra/llm'
import type { LlmConfigRepository } from '../repositories/llm-config.repository'
import type { ResolvedLlmProviderConfig, ResolvedLlmUseCaseConfig } from '../types/llm.types'
import { BizCode, LLM_USE_CASE_VALUES } from '@xdd-zone/contracts'
import { z } from 'zod'
import { createApiKeyHint, decryptLlmSecret, encryptLlmSecret, OpenAILlm } from '#momo/infra/llm'
import { AppError } from '#momo/shared/app-error'

import { toLlmCallLog, toLlmProvider, toLlmUseCaseConfig } from '../llm.presenter'
import { createDefaultLlmUseCaseConfig } from '../types/llm.types'

const POST_META_SOURCE_LIMIT = 4000
const DEFAULT_USE_CASE: LlmUseCase = 'content.post.meta'
const ERROR_MESSAGE_LIMIT = 500
const LOG_TTL_DAYS = 30
const PROVIDER_API_KEY_REQUIRED_MESSAGE = '启用 LLM Provider 前必须配置 API Key'

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

type LlmDriverFactory = (config: ResolvedLlmProviderConfig, apiKey: string, model: string) => LlmDriver

export function createLlmService(
  runtime: MomoRuntime,
  repository?: LlmConfigRepository,
  driverFactory?: LlmDriverFactory,
) {
  async function listProviders(): Promise<LlmProviderListResponse> {
    ensureRepository()
    const providers = await repository!.listProviders()

    return { providers: providers.map(toLlmProvider) }
  }

  async function createProvider(input: CreateLlmProviderRequest): Promise<LlmProviderResponse> {
    ensureRepository()
    ensureProviderCanBeEnabled(input.enabled, input.apiKey)
    const provider = await repository!.createProvider({
      ...input,
      apiKeyCiphertext: input.apiKey ? encryptLlmSecret(input.apiKey, runtime.env.LLM_SECRET_KEY) : null,
      apiKeyHint: input.apiKey ? createApiKeyHint(input.apiKey) : null,
    })

    return { provider: toLlmProvider(provider) }
  }

  async function updateProvider(providerId: string, input: UpdateLlmProviderRequest): Promise<LlmProviderResponse> {
    ensureRepository()
    const current = await requireProvider(providerId)
    ensureProviderCanBeEnabled(input.enabled, input.apiKey ?? current.apiKeyCiphertext)
    const provider = await repository!.updateProvider(providerId, {
      ...input,
      apiKeyCiphertext: input.apiKey ? encryptLlmSecret(input.apiKey, runtime.env.LLM_SECRET_KEY) : undefined,
      apiKeyHint: input.apiKey ? createApiKeyHint(input.apiKey) : undefined,
    })

    if (!provider) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'LLM Provider 不存在', 404)
    }

    return { provider: toLlmProvider(provider) }
  }

  async function clearProviderApiKey(providerId: string): Promise<LlmProviderResponse> {
    ensureRepository()
    const current = await requireProvider(providerId)

    if (current.enabled === 1) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '启用中的 LLM Provider 不能清空 API Key', 409)
    }

    const provider = await repository!.clearProviderApiKey(providerId)

    if (!provider) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'LLM Provider 不存在', 404)
    }

    return { provider: toLlmProvider(provider) }
  }

  async function testProvider(input: {
    actorId?: string | null
    providerId: string
    requestId?: string | null
  }): Promise<TestLlmProviderResponse> {
    ensureRepository()
    const provider = toResolvedProvider(await requireProvider(input.providerId))
    const startedAt = new Date()

    try {
      const driver = createDriverForProvider(provider, provider.defaultModel)
      const result = await driver.generateStructuredJson({
        maxOutputTokens: 32,
        responseFormat: {
          name: 'provider_test',
          schema: {
            additionalProperties: false,
            properties: { ok: { type: 'boolean' } },
            required: ['ok'],
            type: 'object',
          },
        },
        systemPrompt: '只返回 JSON。',
        temperature: 0,
        userPrompt: JSON.stringify({ ok: true }),
      })
      const log = await writeCallLog({
        actorId: input.actorId,
        model: provider.defaultModel,
        operation: 'provider.test',
        provider,
        requestId: input.requestId,
        result,
        startedAt,
        status: 'success',
      })

      return { logId: log.id, status: 'success', usage: result.usage }
    } catch (error) {
      const log = await writeCallLog({
        actorId: input.actorId,
        error,
        model: provider.defaultModel,
        operation: 'provider.test',
        provider,
        requestId: input.requestId,
        startedAt,
        status: 'error',
      })
      throw toAppError(error, log.id)
    }
  }

  async function listUseCaseConfigs(): Promise<LlmUseCaseConfigListResponse> {
    const records = repository ? await repository.listConfigs() : []
    const byUseCase = new Map(records.map((row) => [row.config.useCase, row]))

    return {
      configs: LLM_USE_CASE_VALUES.map((useCase) => byUseCase.get(useCase)).map((row, index) => {
        if (row) {
          return toLlmUseCaseConfig(row)
        }

        return toDefaultUseCaseConfig(LLM_USE_CASE_VALUES[index]!)
      }),
    }
  }

  async function updateUseCaseConfig(
    useCase: LlmUseCase,
    input: UpdateLlmUseCaseConfigRequest,
  ): Promise<LlmUseCaseConfigResponse> {
    ensureRepository()
    const current = await resolveUseCaseConfig(useCase)

    if (input.providerId) {
      await requireProvider(input.providerId)
    }

    const record = await repository!.upsertConfig({
      enabled: input.enabled ?? current.enabled,
      maxOutputTokens: input.maxOutputTokens === undefined ? (current.maxOutputTokens ?? null) : input.maxOutputTokens,
      model: input.model?.trim() ?? current.model,
      providerId: input.providerId === undefined ? (current.providerId ?? null) : input.providerId,
      temperature: input.temperature === undefined ? (current.temperature ?? null) : input.temperature,
      useCase,
    })
    const row = await repository!.findConfigByUseCase(record.useCase)

    return {
      config: toLlmUseCaseConfig(row!),
    }
  }

  async function generatePostMetaSuggestion(input: GeneratePostMetaRequest): Promise<GeneratePostMetaResponse> {
    const config = await resolveUseCaseConfig(DEFAULT_USE_CASE)
    const provider = requireUsableProvider(config)
    const startedAt = new Date()

    try {
      const driver = createDriverForProvider(provider, config.model)
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

      await writeCallLog({
        model: config.model,
        operation: 'content.post.meta',
        provider,
        result,
        startedAt,
        status: 'success',
        useCase: DEFAULT_USE_CASE,
      })

      return {
        suggestion: parsed.data,
        usage: result.usage,
      }
    } catch (error) {
      await writeCallLog({
        error,
        model: config.model,
        operation: 'content.post.meta',
        provider,
        startedAt,
        status: 'error',
        useCase: DEFAULT_USE_CASE,
      })
      throw error
    }
  }

  async function listCallLogs(input: LlmCallLogListQuery): Promise<LlmCallLogListResponse> {
    ensureRepository()
    const result = await repository!.listCallLogs(input)

    return {
      logs: result.logs.map(toLlmCallLog),
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
    }
  }

  async function getCallLog(logId: string): Promise<LlmCallLogResponse> {
    ensureRepository()
    const row = await repository!.findCallLogById(logId)

    if (!row) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'LLM 调用日志不存在', 404)
    }

    return { log: toLlmCallLog(row) }
  }

  async function deleteExpiredCallLogs() {
    ensureRepository()
    const deleted = await repository!.deleteExpiredCallLogs()

    return { deleted }
  }

  return {
    clearProviderApiKey,
    createProvider,
    deleteExpiredCallLogs,
    generatePostMetaSuggestion,
    getCallLog,
    listCallLogs,
    listProviders,
    listUseCaseConfigs,
    testProvider,
    updateProvider,
    updateUseCaseConfig,
  }

  function ensureRepository(): void {
    if (!repository) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 配置仓库未启用', 409)
    }
  }

  function ensureProviderCanBeEnabled(enabled: boolean | undefined, apiKey: string | null | undefined): void {
    if (enabled === true && !apiKey) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, PROVIDER_API_KEY_REQUIRED_MESSAGE, 409)
    }
  }

  async function requireProvider(providerId: string) {
    ensureRepository()
    const provider = await repository!.findProviderById(providerId)

    if (!provider) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'LLM Provider 不存在', 404)
    }

    return provider
  }

  async function resolveUseCaseConfig(useCase: LlmUseCase): Promise<ResolvedLlmUseCaseConfig> {
    const row = repository ? await repository.findConfigByUseCase(useCase) : null

    if (!row) {
      return createDefaultLlmUseCaseConfig(useCase)
    }

    return {
      enabled: row.config.enabled === 1,
      maxOutputTokens: row.config.maxOutputTokens ?? undefined,
      model: row.config.model,
      provider: row.provider ? toResolvedProvider(row.provider) : null,
      providerId: row.config.providerId ?? undefined,
      temperature: row.config.temperature === null ? undefined : Number(row.config.temperature),
      useCase,
    }
  }

  function requireUsableProvider(config: ResolvedLlmUseCaseConfig): ResolvedLlmProviderConfig {
    if (!config.enabled) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 用例未启用', 409)
    }

    if (!config.providerId || !config.provider) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 用例未绑定 Provider', 409)
    }

    if (!config.provider.enabled) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM Provider 未启用', 409)
    }

    if (!config.provider.apiKeyCiphertext) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM Provider 未配置 API Key', 409)
    }

    return config.provider
  }

  function createDriverForProvider(provider: ResolvedLlmProviderConfig, model: string): LlmDriver {
    if (!provider.enabled) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM Provider 未启用', 409)
    }

    if (!provider.apiKeyCiphertext) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM Provider 未配置 API Key', 409)
    }

    const apiKey = decryptLlmSecret(provider.apiKeyCiphertext, runtime.env.LLM_SECRET_KEY)

    if (driverFactory) {
      return driverFactory(provider, apiKey, model)
    }

    return new OpenAILlm({
      apiKey,
      apiFormat: provider.apiFormat,
      baseURL: provider.baseUrl,
      model,
      timeout: provider.timeoutMs,
    })
  }

  function toResolvedProvider(
    provider: Awaited<ReturnType<LlmConfigRepository['findProviderById']>>,
  ): ResolvedLlmProviderConfig {
    if (!provider) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'LLM Provider 不存在', 404)
    }

    return {
      apiFormat: provider.apiFormat,
      apiKeyCiphertext: provider.apiKeyCiphertext,
      baseUrl: provider.baseUrl,
      defaultModel: provider.defaultModel,
      enabled: provider.enabled === 1,
      id: provider.id,
      name: provider.name,
      providerType: provider.providerType,
      timeoutMs: provider.timeoutMs,
    }
  }

  async function writeCallLog(input: {
    actorId?: string | null
    error?: unknown
    model: string
    operation: 'provider.test' | 'content.post.meta'
    provider: ResolvedLlmProviderConfig
    requestId?: string | null
    result?: GenerateStructuredJsonResponse
    startedAt: Date
    status: 'success' | 'error'
    useCase?: LlmUseCase | null
  }) {
    ensureRepository()
    const endedAt = new Date()
    const error = input.error ? normalizeLlmError(input.error) : null

    return repository!.createCallLog({
      actorId: input.actorId,
      durationMs: endedAt.getTime() - input.startedAt.getTime(),
      endedAt,
      errorCode: error?.errorCode,
      errorDetails: error?.errorDetails,
      errorMessage: error?.errorMessage,
      errorStatus: error?.errorStatus,
      errorType: error?.errorType,
      expiresAt: new Date(endedAt.getTime() + LOG_TTL_DAYS * 24 * 60 * 60 * 1000),
      inputTokens: input.result?.usage?.inputTokens,
      model: input.model,
      operation: input.operation,
      outputTokens: input.result?.usage?.outputTokens,
      providerApiFormat: input.provider.apiFormat,
      providerBaseUrl: input.provider.baseUrl,
      providerId: input.provider.id,
      providerName: input.provider.name,
      providerType: input.provider.providerType,
      requestId: input.requestId,
      startedAt: input.startedAt,
      status: input.status,
      totalTokens: input.result?.usage?.totalTokens,
      useCase: input.useCase,
    })
  }

  function toDefaultUseCaseConfig(useCase: LlmUseCase): LlmUseCaseConfig {
    const config = createDefaultLlmUseCaseConfig(useCase)
    const now = new Date(0).toISOString()

    return {
      createdAt: now,
      enabled: config.enabled,
      id: `default_${useCase}`,
      maxOutputTokens: config.maxOutputTokens ?? null,
      model: config.model,
      provider: null,
      providerId: null,
      temperature: config.temperature ?? null,
      updatedAt: now,
      useCase,
    }
  }
}

function normalizeLlmError(error: unknown) {
  const maybeError = error as {
    code?: unknown
    message?: unknown
    name?: unknown
    status?: unknown
    type?: unknown
  }

  return {
    errorCode: typeof maybeError.code === 'string' ? maybeError.code : null,
    errorDetails: null,
    errorMessage: String(maybeError.message ?? 'LLM 调用失败').slice(0, ERROR_MESSAGE_LIMIT),
    errorStatus: typeof maybeError.status === 'number' ? maybeError.status : null,
    errorType: typeof maybeError.type === 'string' ? maybeError.type : String(maybeError.name ?? 'Error'),
  }
}

function toAppError(error: unknown, logId: string): AppError {
  if (error instanceof AppError) {
    return error
  }

  const normalized = normalizeLlmError(error)
  return new AppError(BizCode.BIZ_RULE_VIOLATION, normalized.errorMessage, 409, { logId })
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

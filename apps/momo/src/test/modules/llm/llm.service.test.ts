import type { Logger } from 'pino'
import type { MomoRuntime } from '#momo/bootstrap'
import type { CacheDriver } from '#momo/infra/cache'
import type { SearchDriver } from '#momo/infra/search'
import type { StorageDriver } from '#momo/infra/storage'
import type { LlmConfigRepository } from '../../../modules/llm/repositories/llm-config.repository'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { createApiKeyHint, encryptLlmSecret } from '#momo/infra/llm'

import { createLlmService, getPostMetaUserPrompt } from '../../../modules/llm/services/llm.service'

const LLM_SECRET_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

describe('llm service', () => {
  it('api key hint 不返回完整短密钥', () => {
    expect(createApiKeyHint('short')).not.toBe('short')
    expect(createApiKeyHint('abc')).toBe('****')
  })

  it('content.post.meta 会裁剪 source 后生成 user prompt', () => {
    const prompt = JSON.parse(
      getPostMetaUserPrompt({
        locale: 'zh-CN',
        mode: 'create',
        source: 'a'.repeat(4001),
        targets: ['title'],
      }),
    ) as { source: string }

    expect(prompt.source).toHaveLength(4000)
  })

  it('content.post.meta 会校验模型返回格式并写错误日志', async () => {
    const repository = createRepository({ enabled: true, providerEnabled: true, withApiKey: true })
    const service = createLlmService(createRuntime(), repository, () => ({
      generateStructuredJson: vi.fn().mockResolvedValue({
        data: {
          title: 123,
        },
      }),
    }))

    await expect(
      service.generatePostMetaSuggestion(
        {
          locale: 'zh-CN',
          mode: 'create',
          postId: 'post-1',
          targets: ['title'],
        },
        {
          actorId: 'user-1',
          requestId: 'request-1',
          sourceId: 'post-1',
          sourceType: 'content.post',
        },
      ),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      details: { logId: 'log-1' },
      message: 'LLM 返回的文章字段建议格式不正确',
      status: 409,
    })
    expect(repository.createCallLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        requestId: 'request-1',
        sourceId: 'post-1',
        sourceType: 'content.post',
        status: 'error',
      }),
    )
  })

  it('llm 未启用时返回 409', async () => {
    const service = createLlmService(createRuntime())

    await expect(
      service.generatePostMetaSuggestion({
        locale: 'zh-CN',
        mode: 'create',
        targets: ['title'],
      }),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      status: 409,
    })
  })

  it('use case 禁用时返回 409', async () => {
    const service = createLlmService(
      createRuntime(),
      createRepository({ enabled: false, providerEnabled: true, withApiKey: true }),
    )

    await expect(
      service.generatePostMetaSuggestion({
        locale: 'zh-CN',
        mode: 'create',
        targets: ['title'],
      }),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: 'LLM 用例未启用',
      status: 409,
    })
  })

  it('provider 禁用时返回 409', async () => {
    const service = createLlmService(
      createRuntime(),
      createRepository({ enabled: true, providerEnabled: false, withApiKey: true }),
    )

    await expect(
      service.generatePostMetaSuggestion({
        locale: 'zh-CN',
        mode: 'create',
        targets: ['title'],
      }),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: 'LLM Provider 未启用',
      status: 409,
    })
  })

  it('provider 无 API Key 时返回 409', async () => {
    const service = createLlmService(
      createRuntime(),
      createRepository({ enabled: true, providerEnabled: true, withApiKey: false }),
    )

    await expect(
      service.generatePostMetaSuggestion({
        locale: 'zh-CN',
        mode: 'create',
        targets: ['title'],
      }),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: 'LLM Provider 未配置 API Key',
      status: 409,
    })
  })

  it('创建启用 provider 时必须提交 API Key', async () => {
    const repository = createRepository({ enabled: true, providerEnabled: false, withApiKey: false })
    const service = createLlmService(createRuntime(), repository)

    await expect(
      service.createProvider({
        apiFormat: 'chat_completions',
        baseUrl: 'https://api.example.com',
        defaultModel: 'test-model',
        enabled: true,
        name: 'Test Provider',
        providerType: 'openai',
        timeoutMs: 15000,
      }),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: '启用 LLM Provider 前必须配置 API Key',
      status: 409,
    })
    expect(repository.createProvider).not.toHaveBeenCalled()
  })

  it('更新无密钥 provider 为启用时返回 409', async () => {
    const repository = createRepository({ enabled: true, providerEnabled: false, withApiKey: false })
    const service = createLlmService(createRuntime(), repository)

    await expect(service.updateProvider('provider-1', { enabled: true })).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: '启用 LLM Provider 前必须配置 API Key',
      status: 409,
    })
    expect(repository.updateProvider).not.toHaveBeenCalled()
  })

  it('已有密钥 provider 更新为启用时允许不重新提交 API Key', async () => {
    const repository = createRepository({ enabled: true, providerEnabled: false, withApiKey: true })
    const service = createLlmService(createRuntime(), repository)

    await expect(service.updateProvider('provider-1', { enabled: true })).resolves.toMatchObject({
      provider: {
        enabled: true,
        hasApiKey: true,
        id: 'provider-1',
      },
    })
    expect(repository.updateProvider).toHaveBeenCalledWith('provider-1', {
      enabled: true,
      apiKeyCiphertext: undefined,
      apiKeyHint: undefined,
    })
  })

  it('启用 provider 不能清空 API Key', async () => {
    const repository = createRepository({ enabled: true, providerEnabled: true, withApiKey: true })
    const service = createLlmService(createRuntime(), repository)

    await expect(service.clearProviderApiKey('provider-1')).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: '启用中的 LLM Provider 不能清空 API Key',
      status: 409,
    })
    expect(repository.clearProviderApiKey).not.toHaveBeenCalled()
  })
})

function createRepository(overrides: { enabled: boolean; providerEnabled: boolean; withApiKey: boolean }) {
  const now = new Date()
  const provider = {
    apiFormat: 'chat_completions' as const,
    apiKeyCiphertext: overrides.withApiKey ? encryptLlmSecret('test-openai-api-key', LLM_SECRET_KEY) : null,
    apiKeyHint: overrides.withApiKey ? 'key' : null,
    baseUrl: 'https://api.example.com',
    createdAt: now,
    defaultModel: 'test-model',
    enabled: overrides.providerEnabled ? 1 : 0,
    id: 'provider-1',
    name: 'Test Provider',
    providerType: 'openai' as const,
    timeoutMs: 30000,
    updatedAt: now,
  }
  const repository = {
    clearProviderApiKey: vi.fn(),
    createCallLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
    createProvider: vi.fn().mockImplementation(async (input) => ({
      ...provider,
      ...input,
      enabled: input.enabled ? 1 : 0,
      id: 'provider-created',
    })),
    deleteExpiredCallLogs: vi.fn(),
    findCallLogById: vi.fn(),
    findConfigByUseCase: vi.fn().mockResolvedValue({
      config: {
        createdAt: now,
        enabled: overrides.enabled ? 1 : 0,
        id: 'llm-config-1',
        maxOutputTokens: 512,
        model: 'test-model',
        providerId: 'provider-1',
        temperature: '0.70',
        updatedAt: now,
        useCase: 'content.post.meta',
      },
      provider,
    }),
    findProviderById: vi.fn().mockResolvedValue(provider),
    listCallLogs: vi.fn(),
    listConfigs: vi.fn(),
    listProviders: vi.fn(),
    updateProvider: vi.fn().mockImplementation(async (_providerId, input) => ({
      ...provider,
      ...input,
      apiKeyCiphertext: input.apiKeyCiphertext ?? provider.apiKeyCiphertext,
      apiKeyHint: input.apiKeyHint ?? provider.apiKeyHint,
      enabled: input.enabled === undefined ? provider.enabled : input.enabled ? 1 : 0,
    })),
    upsertConfig: vi.fn(),
  } satisfies Partial<LlmConfigRepository>

  return repository as LlmConfigRepository
}

function createRuntime(envOverrides: Partial<MomoRuntime['env']> = {}): MomoRuntime {
  return {
    cache: {} as CacheDriver,
    env: {
      APP_ENV: 'test',
      BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      BETTER_AUTH_URL: 'http://localhost:7788',
      CACHE_DEFAULT_TTL_SECONDS: 300,
      CACHE_KEY_PREFIX: 'momo',
      CACHE_PROVIDER: 'memory',
      CACHE_URL: undefined,
      CORS_ORIGINS: ['http://localhost:2333'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo_test',
      GITHUB_CLIENT_ID: 'test-github-client-id',
      GITHUB_CLIENT_SECRET: 'test-github-client-secret',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      LLM_SECRET_KEY,
      MEILI_API_KEY: undefined,
      MEILI_HOST: undefined,
      MEILI_INDEX_PREFIX: 'momo',
      LOG_LEVEL: 'silent',
      LOG_SQL: false,
      PORT: 7788,
      SEARCH_PROVIDER: 'none',
      STORAGE_PROVIDER: 'local',
      LOCAL_STORAGE_DIR: undefined,
      COS_SECRET_ID: undefined,
      COS_SECRET_KEY: undefined,
      COS_BUCKET: undefined,
      COS_REGION: undefined,
      COS_PUBLIC_BASE_URL: undefined,
      COS_KEY_PREFIX: 'media',
      COS_SIGNED_URL_EXPIRES: 600,
      ...envOverrides,
    },
    logger: {} as Logger,
    search: {} as SearchDriver,
    storage: {} as StorageDriver,
  }
}

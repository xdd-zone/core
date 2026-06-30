import type { Logger } from 'pino'
import type { MomoRuntime } from '#momo/bootstrap'
import type { CacheDriver } from '#momo/infra/cache'
import type { LlmDriver } from '#momo/infra/llm'
import type { SearchDriver } from '#momo/infra/search'
import type { StorageDriver } from '#momo/infra/storage'
import type { LlmConfigRepository } from '../../../modules/llm/repositories/llm-config.repository'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { DisabledLlm, encryptLlmSecret } from '#momo/infra/llm'

import { createLlmService, getPostMetaUserPrompt } from '../../../modules/llm/services/llm.service'

const LLM_SECRET_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

describe('llm service', () => {
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
    const service = createLlmService(createRuntime(new DisabledLlm()), repository, () => ({
      generateStructuredJson: vi.fn().mockResolvedValue({
        data: {
          title: 123,
        },
      }),
    }))

    await expect(
      service.generatePostMetaSuggestion({
        locale: 'zh-CN',
        mode: 'create',
        targets: ['title'],
      }),
    ).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: 'LLM 返回的文章字段建议格式不正确',
      status: 409,
    })
    expect(repository.createCallLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
  })

  it('llm 未启用时返回 409', async () => {
    const service = createLlmService(createRuntime(new DisabledLlm()))

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
      createRuntime({
        generateStructuredJson: vi.fn(),
      }),
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
      createRuntime({
        generateStructuredJson: vi.fn(),
      }),
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
      createRuntime({
        generateStructuredJson: vi.fn(),
      }),
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
    createProvider: vi.fn(),
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
    updateProvider: vi.fn(),
    upsertConfig: vi.fn(),
  } satisfies Partial<LlmConfigRepository>

  return repository as LlmConfigRepository
}

function createRuntime(llm: LlmDriver, envOverrides: Partial<MomoRuntime['env']> = {}): MomoRuntime {
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
    llm,
    logger: {} as Logger,
    search: {} as SearchDriver,
    storage: {} as StorageDriver,
  }
}

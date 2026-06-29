import type { Logger } from 'pino'
import type { MomoRuntime } from '#momo/bootstrap'
import type { CacheDriver } from '#momo/infra/cache'
import type { LlmDriver } from '#momo/infra/llm'
import type { SearchDriver } from '#momo/infra/search'
import type { StorageDriver } from '#momo/infra/storage'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { DisabledLlm } from '#momo/infra/llm'

import { createLlmService, getPostMetaUserPrompt } from '../../../modules/llm/services/llm.service'

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

  it('content.post.meta 会校验模型返回格式', async () => {
    const service = createLlmService(
      createRuntime(new DisabledLlm(), {
        LLM_PROVIDER: 'openai',
        OPENAI_API_KEY: 'test-openai-api-key',
      }),
      createRepository({
        enabled: true,
        provider: 'openai',
      }),
      () => ({
        generateStructuredJson: vi.fn().mockResolvedValue({
          data: {
            title: 123,
          },
        }),
      }),
    )

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
      createRepository({
        enabled: false,
        provider: 'openai',
      }),
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

  it('provider=none 时返回 409', async () => {
    const service = createLlmService(
      createRuntime({
        generateStructuredJson: vi.fn(),
      }),
      createRepository({
        enabled: true,
        provider: 'none',
      }),
    )

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
})

function createRepository(overrides: { enabled: boolean; provider: 'none' | 'openai' }) {
  const now = new Date()

  return {
    findConfigByUseCase: vi.fn().mockResolvedValue({
      apiFormat: 'chat_completions',
      baseUrl: 'https://api.example.com',
      createdAt: now,
      enabled: overrides.enabled ? 1 : 0,
      id: 'llm-config-1',
      maxOutputTokens: 512,
      model: 'test-model',
      provider: overrides.provider,
      temperature: '0.70',
      timeoutMs: 30000,
      updatedAt: now,
      useCase: 'content.post.meta',
    }),
    listConfigs: vi.fn(),
    upsertConfig: vi.fn(),
  }
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
      LLM_PROVIDER: 'none',
      MEILI_API_KEY: undefined,
      MEILI_HOST: undefined,
      MEILI_INDEX_PREFIX: 'momo',
      LOG_LEVEL: 'silent',
      LOG_SQL: false,
      PORT: 7788,
      OPENAI_API_KEY: undefined,
      OPENAI_API_FORMAT: 'chat_completions',
      OPENAI_BASE_URL: undefined,
      OPENAI_MODEL: 'gpt-5-mini',
      OPENAI_TIMEOUT_MS: 15000,
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

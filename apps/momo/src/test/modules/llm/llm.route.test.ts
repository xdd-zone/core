import type {
  ApiResponse,
  LlmProviderListResponse,
  LlmProviderResponse,
  LlmUseCaseConfigListResponse,
  LlmUseCaseConfigResponse,
} from '@xdd-zone/contracts'
import type app from '#momo/app'
import {
  BizCode,
  LlmProviderListResponseSchema,
  LlmUseCaseConfigListResponseSchema,
  LlmUseCaseConfigResponseSchema,
} from '@xdd-zone/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  bindFifaOwner,
  createCredentialUser,
  prepareAuthTestDatabase,
  resetAuthTestData,
  signInByEmail,
} from '#momo/test/helpers/auth-test-db'

let momoApp: typeof app
let ownerCookie: string

describe('llm 路由', () => {
  beforeAll(async () => {
    await prepareAuthTestDatabase()
    momoApp = (await import('#momo/app')).default
  })

  beforeEach(async () => {
    await resetAuthTestData()
    const owner = await createCredentialUser({ email: 'llm-owner@example.com', name: 'LLM Owner' })
    await bindFifaOwner(owner.id)
    ownerCookie = await signInByEmail(momoApp, owner.email)
  })

  afterAll(async () => {
    const { closeDb } = await import('#momo/infra/db/client')
    await closeDb()
  })

  it('未登录请求 LLM 配置列表被拒绝', async () => {
    const response = await momoApp.request('/rpc/llm/use-cases')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 fifa owner 请求 LLM 配置列表被拒绝', async () => {
    const user = await createCredentialUser({ email: 'llm-normal@example.com', name: 'LLM Normal' })
    const cookie = await signInByEmail(momoApp, user.email)

    const response = await momoApp.request('/rpc/llm/use-cases', {
      headers: { cookie },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('可以读取 LLM use case 配置', async () => {
    const response = await momoApp.request('/rpc/llm/use-cases', {
      headers: { cookie: ownerCookie },
    })
    const body = (await response.json()) as ApiResponse<LlmUseCaseConfigListResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    LlmUseCaseConfigListResponseSchema.parse(data)
    expect(data.configs[0]?.useCase).toBe('content.post.meta')
  })

  it('可以读取 LLM provider 列表', async () => {
    const response = await momoApp.request('/rpc/llm/providers', {
      headers: { cookie: ownerCookie },
    })
    const body = (await response.json()) as ApiResponse<LlmProviderListResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    LlmProviderListResponseSchema.parse(data)
    expect(data.providers[0]).toMatchObject({
      id: 'llm_provider_default',
      providerType: 'openai',
    })
  })

  it('创建启用 provider 时必须提交 API Key', async () => {
    const response = await momoApp.request('/rpc/llm/providers', {
      body: JSON.stringify({
        apiFormat: 'chat_completions',
        baseUrl: 'https://api.example.com',
        defaultModel: 'gpt-test',
        enabled: true,
        name: 'No Key Provider',
        providerType: 'openai',
        timeoutMs: 15000,
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(409)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)
    expect(!body.ok && body.error.message).toBe('启用 LLM Provider 前必须配置 API Key')
  })

  it('创建带短 API Key 的 provider 时列表不会返回完整密钥', async () => {
    const createResponse = await momoApp.request('/rpc/llm/providers', {
      body: JSON.stringify({
        apiFormat: 'chat_completions',
        apiKey: 'short',
        baseUrl: 'https://api.example.com',
        defaultModel: 'gpt-test',
        enabled: true,
        name: 'Short Key Provider',
        providerType: 'openai',
        timeoutMs: 15000,
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'POST',
    })
    const createBody = (await createResponse.json()) as ApiResponse<LlmProviderResponse>

    expect(createResponse.status).toBe(201)
    const created = expectOkData(createBody).provider

    const listResponse = await momoApp.request('/rpc/llm/providers', {
      headers: { cookie: ownerCookie },
    })
    const listBody = (await listResponse.json()) as ApiResponse<LlmProviderListResponse>
    const providers = expectOkData(listBody).providers
    const provider = providers.find((item) => item.id === created.id)

    expect(provider?.apiKeyHint).not.toBe('short')
    expect(provider?.apiKeyHint).toBe('****')
  })

  it('更新无密钥 provider 为启用时返回 409', async () => {
    const createResponse = await momoApp.request('/rpc/llm/providers', {
      body: JSON.stringify({
        apiFormat: 'chat_completions',
        baseUrl: 'https://api.example.com',
        defaultModel: 'gpt-test',
        enabled: false,
        name: 'Disabled Provider',
        providerType: 'openai',
        timeoutMs: 15000,
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'POST',
    })
    const createBody = (await createResponse.json()) as ApiResponse<LlmProviderResponse>
    const provider = expectOkData(createBody).provider

    const response = await momoApp.request(`/rpc/llm/providers/${provider.id}`, {
      body: JSON.stringify({ enabled: true }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(409)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)
    expect(!body.ok && body.error.message).toBe('启用 LLM Provider 前必须配置 API Key')
  })

  it('可以更新 LLM use case 配置', async () => {
    const response = await momoApp.request('/rpc/llm/use-cases/content.post.meta', {
      body: JSON.stringify({
        enabled: true,
        maxOutputTokens: 1024,
        model: 'gpt-test',
        providerId: 'llm_provider_default',
        temperature: 0.7,
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<LlmUseCaseConfigResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    LlmUseCaseConfigResponseSchema.parse(data)
    expect(data.config).toMatchObject({
      enabled: true,
      maxOutputTokens: 1024,
      model: 'gpt-test',
      providerId: 'llm_provider_default',
      temperature: 0.7,
      useCase: 'content.post.meta',
    })
    expect(data.config.provider).toMatchObject({ id: 'llm_provider_default' })
  })

  it('非法 use case 返回 400', async () => {
    const response = await momoApp.request('/rpc/llm/use-cases/unknown', {
      body: JSON.stringify({ enabled: true }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_INVALID_REQUEST)
  })

  it('非法参数返回 400', async () => {
    const response = await momoApp.request('/rpc/llm/use-cases/content.post.meta', {
      body: JSON.stringify({ maxOutputTokens: -1 }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_INVALID_REQUEST)
  })
})

function jsonHeaders(cookie: string) {
  return {
    'content-type': 'application/json',
    cookie,
  }
}

function expectOkData<T>(body: ApiResponse<T>): T {
  expect(body.ok).toBe(true)

  if (!body.ok) {
    throw new Error(body.error.message)
  }

  return body.data
}

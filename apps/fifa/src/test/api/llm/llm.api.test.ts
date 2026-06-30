import type { ApiResponse, LlmProviderListResponse, LlmUseCaseConfigListResponse, LlmUseCaseConfigResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  listProviders: vi.fn(),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProviderApiKey: vi.fn(),
  testProvider: vi.fn(),
  listUseCases: vi.fn(),
  updateUseCase: vi.fn(),
  listCallLogs: vi.fn(),
  getCallLog: vi.fn(),
  deleteExpiredCallLogs: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      llm: {
        providers: {
          $get: rpcMocks.listProviders,
          $post: rpcMocks.createProvider,
          ':providerId': {
            $patch: rpcMocks.updateProvider,
            'api-key': {
              $delete: rpcMocks.deleteProviderApiKey,
            },
            test: {
              $post: rpcMocks.testProvider,
            },
          },
        },
        'use-cases': {
          $get: rpcMocks.listUseCases,
          ':useCase': {
            $patch: rpcMocks.updateUseCase,
          },
        },
        'call-logs': {
          $get: rpcMocks.listCallLogs,
          expired: {
            $delete: rpcMocks.deleteExpiredCallLogs,
          },
          ':logId': {
            $get: rpcMocks.getCallLog,
          },
        },
      },
    },
  },
}))

describe('llm api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取 use case 配置时返回 Momo 统一响应', async () => {
    const responseBody: ApiResponse<LlmUseCaseConfigListResponse> = {
      ok: true,
      data: {
        configs: [],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.listUseCases.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { listLlmUseCaseConfigs } = await import('@fifa/api/llm/llm.api')

    await expect(listLlmUseCaseConfigs()).resolves.toEqual(responseBody)
  })

  it('读取 providers 配置', async () => {
    const responseBody: ApiResponse<LlmProviderListResponse> = {
      ok: true,
      data: {
        providers: [],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.listProviders.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { listLlmProviders } = await import('@fifa/api/llm/llm.api')

    await expect(listLlmProviders()).resolves.toEqual(responseBody)
  })

  it('更新 use case 配置时传入 path 参数和请求体', async () => {
    const responseBody: ApiResponse<LlmUseCaseConfigResponse> = {
      ok: true,
      data: {
        config: {
          createdAt: '2026-01-01T00:00:00.000Z',
          enabled: true,
          id: 'llm-config-1',
          maxOutputTokens: null,
          model: 'gpt-test',
          provider: null,
          providerId: null,
          temperature: null,
          updatedAt: '2026-01-01T00:00:00.000Z',
          useCase: 'content.post.meta',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    const payload = {
      enabled: true,
      model: 'gpt-test',
    }
    rpcMocks.updateUseCase.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { updateLlmUseCaseConfig } = await import('@fifa/api/llm/llm.api')

    await expect(updateLlmUseCaseConfig('content.post.meta', payload)).resolves.toEqual(responseBody)
    expect(rpcMocks.updateUseCase).toHaveBeenCalledWith({
      json: payload,
      param: {
        useCase: 'content.post.meta',
      },
    })
  })
})

import type { ApiResponse, LlmUseCaseConfigListResponse, LlmUseCaseConfigResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  listUseCases: vi.fn(),
  updateUseCase: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      llm: {
        'use-cases': {
          $get: rpcMocks.listUseCases,
          ':useCase': {
            $patch: rpcMocks.updateUseCase,
          },
        },
      },
    },
  },
}))

describe('llm api 封装', () => {
  afterEach(() => {
    rpcMocks.listUseCases.mockReset()
    rpcMocks.updateUseCase.mockReset()
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

  it('更新 use case 配置时传入 path 参数和请求体', async () => {
    const responseBody: ApiResponse<LlmUseCaseConfigResponse> = {
      ok: true,
      data: {
        config: {
          apiFormat: 'responses',
          baseUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          enabled: true,
          hasApiKey: true,
          id: 'llm-config-1',
          maxOutputTokens: null,
          model: 'gpt-test',
          provider: 'openai',
          temperature: null,
          timeoutMs: 30000,
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

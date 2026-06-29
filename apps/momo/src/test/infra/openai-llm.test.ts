import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OpenAILlm } from '#momo/infra/llm'

const { createChatCompletionMock, createResponseMock, openAIConstructorMock } = vi.hoisted(() => {
  const createChatCompletionMock = vi.fn()
  const createResponseMock = vi.fn()
  const openAIConstructorMock = vi.fn(
    class {
      chat: {
        completions: {
          create: typeof createChatCompletionMock
        }
      } = {
        completions: {
          create: createChatCompletionMock,
        },
      }

      responses: {
        create: typeof createResponseMock
      } = {
        create: createResponseMock,
      }
    },
  )

  return {
    createChatCompletionMock,
    createResponseMock,
    openAIConstructorMock,
  }
})

vi.mock('openai', () => ({
  default: openAIConstructorMock,
}))

describe('openai llm', () => {
  beforeEach(() => {
    createChatCompletionMock.mockReset()
    createResponseMock.mockReset()
    openAIConstructorMock.mockClear()
  })

  it('使用 Chat Completions 兼容接口生成文章字段建议', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              excerpt: '测试摘要',
              slug: 'test-post',
              title: '测试标题',
            }),
          },
        },
      ],
      usage: {
        completion_tokens: 5,
        prompt_tokens: 10,
        total_tokens: 15,
      },
    })

    const llm = new OpenAILlm({
      apiKey: 'test-api-key',
      apiFormat: 'chat_completions',
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      timeout: 15_000,
    })

    await expect(
      llm.generatePostMeta({
        locale: 'zh-CN',
        mode: 'create',
        source: '# 测试文章',
        targets: ['title', 'slug', 'excerpt'],
      }),
    ).resolves.toEqual({
      suggestion: {
        excerpt: '测试摘要',
        slug: 'test-post',
        title: '测试标题',
      },
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      },
    })

    expect(openAIConstructorMock).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      baseURL: 'https://api.deepseek.com',
      timeout: 15_000,
    })
    expect(createChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'deepseek-v4-flash',
        response_format: { type: 'json_object' },
      }),
    )
    expect(createResponseMock).not.toHaveBeenCalled()
  })

  it('使用 Responses 接口生成文章字段建议', async () => {
    createResponseMock.mockResolvedValue({
      output_text: JSON.stringify({
        excerpt: '测试摘要',
        slug: 'test-post',
        title: '测试标题',
      }),
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
      },
    })

    const llm = new OpenAILlm({
      apiKey: 'test-api-key',
      apiFormat: 'responses',
      model: 'gpt-5-mini',
      timeout: 15_000,
    })

    await expect(
      llm.generatePostMeta({
        locale: 'zh-CN',
        mode: 'create',
        source: '# 测试文章',
        targets: ['title', 'slug', 'excerpt'],
      }),
    ).resolves.toEqual({
      suggestion: {
        excerpt: '测试摘要',
        slug: 'test-post',
        title: '测试标题',
      },
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      },
    })

    expect(createResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-mini',
        text: expect.objectContaining({
          format: expect.objectContaining({
            type: 'json_schema',
          }),
        }),
      }),
    )
    expect(createChatCompletionMock).not.toHaveBeenCalled()
  })
})

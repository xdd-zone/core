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

  it('使用 Chat Completions 兼容接口生成结构化 JSON', async () => {
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
      llm.generateStructuredJson({
        responseFormat: {
          name: 'post_meta_suggestion',
          schema: {
            additionalProperties: false,
            properties: {
              excerpt: { type: 'string' },
              slug: { type: 'string' },
              title: { type: 'string' },
            },
            required: [],
            type: 'object',
          },
        },
        systemPrompt: '只返回 JSON',
        userPrompt: JSON.stringify({ source: '# 测试文章' }),
      }),
    ).resolves.toEqual({
      data: {
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
        messages: [
          {
            content: '只返回 JSON',
            role: 'system',
          },
          {
            content: JSON.stringify({ source: '# 测试文章' }),
            role: 'user',
          },
        ],
        response_format: { type: 'json_object' },
      }),
    )
    expect(createResponseMock).not.toHaveBeenCalled()
  })

  it('使用 Responses 接口生成结构化 JSON', async () => {
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
      llm.generateStructuredJson({
        responseFormat: {
          name: 'post_meta_suggestion',
          schema: {
            additionalProperties: false,
            properties: {
              excerpt: { type: 'string' },
              slug: { type: 'string' },
              title: { type: 'string' },
            },
            required: [],
            type: 'object',
          },
        },
        systemPrompt: '只返回 JSON',
        userPrompt: JSON.stringify({ source: '# 测试文章' }),
      }),
    ).resolves.toEqual({
      data: {
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
        input: [
          {
            content: '只返回 JSON',
            role: 'system',
          },
          {
            content: JSON.stringify({ source: '# 测试文章' }),
            role: 'user',
          },
        ],
        text: expect.objectContaining({
          format: expect.objectContaining({
            name: 'post_meta_suggestion',
            type: 'json_schema',
          }),
        }),
      }),
    )
    expect(createChatCompletionMock).not.toHaveBeenCalled()
  })
})

import type { GeneratePostMetaRequest, GeneratePostMetaResponse } from '@xdd-zone/contracts'
import type { LlmDriver } from './llm.types'
import OpenAI from 'openai'
import { z } from 'zod'

const MODEL_SOURCE_LIMIT = 4000

const modelOutputSchema = z.object({
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
})

export type OpenAIApiFormat = 'chat_completions' | 'responses'

export interface OpenAILlmConfig {
  apiKey: string
  apiFormat: OpenAIApiFormat
  baseURL?: string
  model: string
  timeout: number
}

export class OpenAILlm implements LlmDriver {
  private readonly client: OpenAI

  constructor(private readonly config: OpenAILlmConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout,
    })
  }

  async generatePostMeta(input: GeneratePostMetaRequest): Promise<GeneratePostMetaResponse> {
    if (this.config.apiFormat === 'responses') {
      return this.generatePostMetaWithResponses(input)
    }

    return this.generatePostMetaWithChatCompletions(input)
  }

  private async generatePostMetaWithChatCompletions(
    input: GeneratePostMetaRequest,
  ): Promise<GeneratePostMetaResponse> {
    const response = await this.client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: this.getUserPrompt(input),
        },
      ],
      model: this.config.model,
      response_format: { type: 'json_object' },
    })

    const parsed = modelOutputSchema.parse(JSON.parse(response.choices[0]?.message.content || '{}'))

    return {
      suggestion: parsed,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }

  private async generatePostMetaWithResponses(input: GeneratePostMetaRequest): Promise<GeneratePostMetaResponse> {
    const response = await this.client.responses.create({
      input: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: this.getUserPrompt(input),
        },
      ],
      model: this.config.model,
      text: {
        format: {
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
          strict: false,
          type: 'json_schema',
        },
      },
    })

    const parsed = modelOutputSchema.parse(JSON.parse(response.output_text || '{}'))

    return {
      suggestion: parsed,
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }

  private getSystemPrompt(): string {
    return '你是文章编辑助手。只返回 JSON。slug 必须使用小写英文、数字和连字符。摘要要直接描述文章内容，不写营销话。'
  }

  private getUserPrompt(input: GeneratePostMetaRequest): string {
    return JSON.stringify({
      excerpt: input.excerpt ?? null,
      locale: input.locale,
      mode: input.mode,
      slug: input.slug,
      source: input.source ? input.source.slice(0, MODEL_SOURCE_LIMIT) : undefined,
      targets: input.targets,
      title: input.title,
    })
  }
}

import type { GenerateStructuredJsonRequest, GenerateStructuredJsonResponse, LlmDriver } from './llm.types'
import OpenAI from 'openai'

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

  async generateStructuredJson<TData = unknown>(
    input: GenerateStructuredJsonRequest,
  ): Promise<GenerateStructuredJsonResponse<TData>> {
    if (this.config.apiFormat === 'responses') {
      return this.generateStructuredJsonWithResponses<TData>(input)
    }

    return this.generateStructuredJsonWithChatCompletions<TData>(input)
  }

  private async generateStructuredJsonWithChatCompletions<TData = unknown>(
    input: GenerateStructuredJsonRequest,
  ): Promise<GenerateStructuredJsonResponse<TData>> {
    const response = await this.client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: input.systemPrompt,
        },
        {
          role: 'user',
          content: input.userPrompt,
        },
      ],
      max_completion_tokens: input.maxOutputTokens,
      model: this.config.model,
      response_format: { type: 'json_object' },
      temperature: input.temperature,
    })

    const data = JSON.parse(response.choices[0]?.message.content || '{}') as TData

    return {
      data,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }

  private async generateStructuredJsonWithResponses<TData = unknown>(
    input: GenerateStructuredJsonRequest,
  ): Promise<GenerateStructuredJsonResponse<TData>> {
    const response = await this.client.responses.create({
      input: [
        {
          role: 'system',
          content: input.systemPrompt,
        },
        {
          role: 'user',
          content: input.userPrompt,
        },
      ],
      max_output_tokens: input.maxOutputTokens,
      model: this.config.model,
      temperature: input.temperature,
      text: {
        format: {
          name: input.responseFormat.name,
          schema: input.responseFormat.schema,
          strict: input.responseFormat.strict ?? false,
          type: 'json_schema',
        },
      },
    })

    const data = JSON.parse(response.output_text || '{}') as TData

    return {
      data,
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }
}

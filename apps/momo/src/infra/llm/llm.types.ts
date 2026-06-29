export interface LlmUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export interface LlmStructuredJsonFormat {
  name: string
  schema: Record<string, unknown>
  strict?: boolean
}

export interface GenerateStructuredJsonRequest {
  maxOutputTokens?: number
  responseFormat: LlmStructuredJsonFormat
  systemPrompt: string
  temperature?: number
  userPrompt: string
}

export interface GenerateStructuredJsonResponse<TData = unknown> {
  data: TData
  usage?: LlmUsage
}

export interface LlmDriver {
  generateStructuredJson: <TData = unknown>(
    input: GenerateStructuredJsonRequest,
  ) => Promise<GenerateStructuredJsonResponse<TData>>
}

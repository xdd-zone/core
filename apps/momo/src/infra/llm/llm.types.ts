import type { GeneratePostMetaRequest, GeneratePostMetaResponse } from '@xdd-zone/contracts'

export interface LlmDriver {
  generatePostMeta: (input: GeneratePostMetaRequest) => Promise<GeneratePostMetaResponse>
}

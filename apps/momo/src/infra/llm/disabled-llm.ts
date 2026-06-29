import type { GeneratePostMetaRequest, GeneratePostMetaResponse } from '@xdd-zone/contracts'
import type { LlmDriver } from './llm.types'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

export class DisabledLlm implements LlmDriver {
  generatePostMeta(_input: GeneratePostMetaRequest): Promise<GeneratePostMetaResponse> {
    throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 未启用，先配置 LLM_PROVIDER 和 OPENAI_API_KEY', 409)
  }
}

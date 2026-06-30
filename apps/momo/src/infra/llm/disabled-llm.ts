import type { GenerateStructuredJsonRequest, GenerateStructuredJsonResponse, LlmDriver } from './llm.types'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

export class DisabledLlm implements LlmDriver {
  generateStructuredJson<TData = unknown>(
    _input: GenerateStructuredJsonRequest,
  ): Promise<GenerateStructuredJsonResponse<TData>> {
    throw new AppError(BizCode.BIZ_RULE_VIOLATION, 'LLM 未启用，先配置数据库里的 LLM Provider', 409)
  }
}

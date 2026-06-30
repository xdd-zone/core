import {
  LLM_API_FORMAT_VALUES,
  LLM_CALL_OPERATION_VALUES,
  LLM_CALL_STATUS_VALUES,
  LLM_PROVIDER_TYPE_VALUES,
  LLM_USE_CASE_VALUES,
} from '@xdd-zone/contracts'
import { index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const llmUseCaseEnum = pgEnum('llm_use_case', LLM_USE_CASE_VALUES)
export const llmProviderTypeEnum = pgEnum('llm_provider_type', LLM_PROVIDER_TYPE_VALUES)
export const llmApiFormatEnum = pgEnum('llm_api_format', LLM_API_FORMAT_VALUES)
export const llmCallOperationEnum = pgEnum('llm_call_operation', LLM_CALL_OPERATION_VALUES)
export const llmCallStatusEnum = pgEnum('llm_call_status', LLM_CALL_STATUS_VALUES)

export const llmProviders = pgTable('llm_providers', {
  /** Provider 主键。 */
  id: text('id').primaryKey(),
  /** Provider 显示名称。 */
  name: text('name').notNull(),
  /** Provider 协议类型，第一版只支持 OpenAI 兼容接口。 */
  providerType: llmProviderTypeEnum('provider_type').notNull().default('openai'),
  /** OpenAI 兼容服务地址。 */
  baseUrl: text('base_url').notNull(),
  /** OpenAI SDK 调用接口。 */
  apiFormat: llmApiFormatEnum('api_format').notNull().default('chat_completions'),
  /** 默认模型名称。 */
  defaultModel: text('default_model').notNull(),
  /** 单次请求超时时间，单位毫秒。 */
  timeoutMs: integer('timeout_ms').notNull().default(15000),
  /** 是否允许业务调用这个 Provider。 */
  enabled: integer('enabled').notNull().default(0),
  /** 加密后的 API Key。 */
  apiKeyCiphertext: text('api_key_ciphertext'),
  /** API Key 尾号提示，不保存完整明文。 */
  apiKeyHint: text('api_key_hint'),
  /** 创建时间。 */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** 更新时间。 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const llmUseCaseConfigs = pgTable(
  'llm_use_case_configs',
  {
    /** 配置主键。 */
    id: text('id').primaryKey(),
    /** LLM 用例代码。 */
    useCase: llmUseCaseEnum('use_case').notNull(),
    /** 是否允许这个用例调用模型。 */
    enabled: integer('enabled').notNull().default(0),
    /** 当前用例绑定的 Provider。 */
    providerId: text('provider_id').references(() => llmProviders.id, { onDelete: 'set null' }),
    /** 模型名称。 */
    model: text('model').notNull(),
    /** 采样温度。 */
    temperature: numeric('temperature', { precision: 3, scale: 2 }),
    /** 单次输出 token 上限。 */
    maxOutputTokens: integer('max_output_tokens'),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('llm_use_case_configs_use_case_unique').on(table.useCase)],
)

export const llmCallLogs = pgTable(
  'llm_call_logs',
  {
    /** 日志主键。 */
    id: text('id').primaryKey(),
    /** 调用操作代码。 */
    operation: llmCallOperationEnum('operation').notNull(),
    /** 业务用例代码，Provider 测试时为空。 */
    useCase: llmUseCaseEnum('use_case'),
    /** 调用时绑定的 Provider ID。 */
    providerId: text('provider_id').references(() => llmProviders.id, { onDelete: 'set null' }),
    /** 调用时的 Provider 名称快照。 */
    providerName: text('provider_name').notNull(),
    /** 调用时的 Provider 类型快照。 */
    providerType: llmProviderTypeEnum('provider_type').notNull(),
    /** 调用时的 Provider baseUrl 快照。 */
    providerBaseUrl: text('provider_base_url').notNull(),
    /** 调用时的 Provider apiFormat 快照。 */
    providerApiFormat: llmApiFormatEnum('provider_api_format').notNull(),
    /** 调用模型名称。 */
    model: text('model').notNull(),
    /** 调用状态。 */
    status: llmCallStatusEnum('status').notNull(),
    /** 调用开始时间。 */
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    /** 调用结束时间。 */
    endedAt: timestamp('ended_at', { withTimezone: true }),
    /** 调用耗时，单位毫秒。 */
    durationMs: integer('duration_ms'),
    /** 输入 token 数。 */
    inputTokens: integer('input_tokens'),
    /** 输出 token 数。 */
    outputTokens: integer('output_tokens'),
    /** 总 token 数。 */
    totalTokens: integer('total_tokens'),
    /** 错误类型。 */
    errorType: text('error_type'),
    /** 第三方返回的错误代码。 */
    errorCode: text('error_code'),
    /** 第三方返回的 HTTP 状态码。 */
    errorStatus: integer('error_status'),
    /** 截断后的错误信息。 */
    errorMessage: text('error_message'),
    /** 安全错误详情，不保存完整第三方响应。 */
    errorDetails: jsonb('error_details'),
    /** 当前请求 ID。 */
    requestId: text('request_id'),
    /** 发起人用户 ID。 */
    actorId: text('actor_id'),
    /** 来源对象类型。 */
    sourceType: text('source_type'),
    /** 来源对象 ID。 */
    sourceId: text('source_id'),
    /** 日志过期时间。 */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('llm_call_logs_provider_id_idx').on(table.providerId),
    index('llm_call_logs_request_id_idx').on(table.requestId),
    index('llm_call_logs_started_at_idx').on(table.startedAt),
    index('llm_call_logs_status_idx').on(table.status),
    index('llm_call_logs_use_case_idx').on(table.useCase),
  ],
)

import { LLM_API_FORMAT_VALUES, LLM_PROVIDER_VALUES, LLM_USE_CASE_VALUES } from '@xdd-zone/contracts'
import { integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const llmUseCaseEnum = pgEnum('llm_use_case', LLM_USE_CASE_VALUES)
export const llmProviderEnum = pgEnum('llm_provider', LLM_PROVIDER_VALUES)
export const llmApiFormatEnum = pgEnum('llm_api_format', LLM_API_FORMAT_VALUES)

export const llmUseCaseConfigs = pgTable(
  'llm_use_case_configs',
  {
    /** 配置主键。 */
    id: text('id').primaryKey(),
    /** LLM 用例代码。 */
    useCase: llmUseCaseEnum('use_case').notNull(),
    /** 是否允许这个用例调用模型。 */
    enabled: integer('enabled').notNull().default(0),
    /** 模型服务类型。 */
    provider: llmProviderEnum('provider').notNull().default('none'),
    /** 模型名称。 */
    model: text('model').notNull(),
    /** OpenAI SDK 调用接口。 */
    apiFormat: llmApiFormatEnum('api_format').notNull().default('chat_completions'),
    /** OpenAI 兼容服务地址，不保存密钥。 */
    baseUrl: text('base_url'),
    /** 单次请求超时时间，单位毫秒。 */
    timeoutMs: integer('timeout_ms').notNull(),
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

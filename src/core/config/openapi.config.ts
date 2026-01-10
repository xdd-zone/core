/**
 * OpenAPI 文档配置
 * - 路径固定为 '/openapi'，不受全局 API 前缀影响
 * - 在开发环境默认开启
 */
import type { RuntimeEnv, YamlConfig } from './utils'

export interface OpenapiConfig {
  enabled: boolean
  path: string
  title: string
  description: string
  version: string
}

export function createOpenapiConfig(env: RuntimeEnv, yaml: YamlConfig): OpenapiConfig {
  return {
    enabled: yaml.openapi_enabled ?? env.isDevelopment,
    path: yaml.openapi_path ?? '/openapi',
    title: yaml.openapi_title ?? 'XDD SPACE API',
    description: yaml.openapi_description ?? 'XDD SPACE API documentation',
    version: yaml.openapi_version ?? '0.0.0',
  }
}

import type { RuntimeEnv, YamlConfig } from './utils'
/**
 * 应用配置（端口、全局前缀、调试与 CORS）
 * - createAppConfig 通过运行环境与 YAML 配置生成最终 AppConfig
 */
import { z } from 'zod'

export interface AppConfig {
  env: 'development' | 'test' | 'production'
  port: number
  prefix: string
  enableCors: boolean
}

/** 生成应用配置 */
export function createAppConfig(env: RuntimeEnv, yaml: YamlConfig): AppConfig {
  const portSchema = z.coerce.number().int().positive().default(7788)
  const envPort = process.env.PORT ? portSchema.parse(process.env.PORT) : undefined

  return {
    env: env.nodeEnv,
    port: envPort ?? yaml.port ?? 7788,
    prefix: yaml.prefix ?? 'api',
    enableCors: env.isDevelopment,
  }
}

import type { AppConfig } from './app.config'
import type { BetterAuthConfig } from './better-auth.config'
import type { DatabaseConfig } from './database.config'
import type { LoggerConfig } from './logger.config'
import type { OpenapiConfig } from './openapi.config'
import { createAppConfig } from './app.config'
import { createBetterAuthConfig } from './better-auth.config'
import { createDatabaseConfig } from './database.config'
import { createLoggerConfig } from './logger.config'
import { createOpenapiConfig } from './openapi.config'
/**
 * 配置聚合入口
 * - 读取运行环境（env）与 YAML 配置文件
 * - 通过各配置工厂生成最终配置并导出
 * - 在调试模式打印当前配置（不含敏感信息）
 */
import { getEnv, YAML_CONFIG } from './utils'

const env = getEnv()
export const APP_CONFIG: AppConfig = createAppConfig(env, YAML_CONFIG)
export const OPENAPI_CONFIG: OpenapiConfig = createOpenapiConfig(env, YAML_CONFIG)
export const LOGGER_CONFIG: LoggerConfig = createLoggerConfig(env.isProduction, YAML_CONFIG)
export const DATABASE_CONFIG: DatabaseConfig = createDatabaseConfig(env)
export const BETTER_AUTH_CONFIG: BetterAuthConfig = createBetterAuthConfig({}, YAML_CONFIG)

export const CONFIG = {
  app: APP_CONFIG,
  logger: LOGGER_CONFIG,
  openapi: OPENAPI_CONFIG,
  database: DATABASE_CONFIG,
  betterAuth: BETTER_AUTH_CONFIG,
}

// 导出类型
export type { AppConfig, DatabaseConfig, LoggerConfig, OpenapiConfig }
export type { LogLevel, RuntimeEnv, YamlConfig } from './utils'

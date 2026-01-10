import type { RuntimeEnv } from './utils'
/**
 * 数据库配置
 * - 连接字符串
 * - 日志级别配置
 * - createDatabaseConfig 通过运行环境、YAML 配置与环境变量生成最终 DatabaseConfig
 */
import { z } from 'zod'

export interface DatabaseConfig {
  connectionString: string
  logQuery: boolean
  logError: boolean
  logInfo: boolean
  logWarn: boolean
}

/** 生成数据库配置 */
export function createDatabaseConfig(env: RuntimeEnv): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL ?? ''
  const urlSchema = z.string().url()

  return {
    connectionString: urlSchema.parse(connectionString),
    logQuery: env.isDevelopment,
    logError: true,
    logInfo: env.isDevelopment,
    logWarn: true,
  }
}

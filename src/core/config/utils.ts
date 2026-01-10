import { existsSync, readFileSync } from 'node:fs'
/**
 * 配置工具函数
 * - YAML 配置文件加载
 * - 环境变量加载与运行环境标识
 * - Zod 类型校验和转换
 */
import path from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import { load as yamlLoad } from 'js-yaml'
import { z } from 'zod'

// ==================== 类型定义 ====================

/** Zod schema for log level */
const logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])

/** Zod schema for YAML configuration */
const yamlConfigSchema = z
  .object({
    port: z.coerce.number().int().positive().optional(),
    prefix: z.string().optional(),
    openapi_enabled: z.coerce.boolean().optional(),
    openapi_path: z.string().optional(),
    openapi_title: z.string().optional(),
    openapi_description: z.string().optional(),
    openapi_version: z.string().optional(),
    logger_level: logLevelSchema.optional(),
    logger_file_path: z.string().nullable().optional(),
    database_url: z.string().url().optional(),
    better_auth_secret: z.string().min(1).optional(),
    better_auth_url: z.string().url().optional(),
  })
  .partial()

export type LogLevel = z.infer<typeof logLevelSchema>
export type YamlConfig = z.infer<typeof yamlConfigSchema>

type NodeEnv = 'development' | 'test' | 'production'

export interface RuntimeEnv {
  nodeEnv: NodeEnv
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
}

// ==================== 工具函数 ====================

/** 判断对象是否为普通对象（非数组） */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// ==================== YAML 配置加载 ====================

/** 加载并解析 YAML 配置文件 */
function loadYaml(filePath: string): Record<string, unknown> {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  const text = readFileSync(abs, 'utf8')
  const doc = yamlLoad(text)
  return isPlainObject(doc) ? doc : {}
}

/** 从 YAML 中挑选有效键并做类型转换 */
function parseYamlConfig(raw: Record<string, unknown>): YamlConfig {
  const result = yamlConfigSchema.safeParse(raw)
  return result.success ? result.data : {}
}

// ==================== 环境变量处理 ====================

/**
 * 规范化 NODE_ENV 为受控枚举
 */
function normalizeNodeEnv(env: unknown): NodeEnv {
  const value = typeof env === 'string' ? env.trim().toLowerCase() : 'development'
  return value === 'production' || value === 'test' ? value : 'development'
}

/**
 * 获取当前运行环境（首次调用会加载 .env）
 */
export function getEnv(): RuntimeEnv {
  dotenvConfig()
  const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV)
  return {
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
  }
}

// ==================== 导出配置 ====================

/** 配置文件路径（支持环境变量 CONFIG_PATH，默认为 config.yaml） */
const CONFIG_PATH = process.env.CONFIG_PATH || 'config.yaml'

/** 从 config.yaml 加载的配置（如果文件不存在则返回空对象） */
export const YAML_CONFIG: YamlConfig = existsSync(CONFIG_PATH) ? parseYamlConfig(loadYaml(CONFIG_PATH)) : {}

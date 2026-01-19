import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { load as yamlLoad } from 'js-yaml'
import { z } from 'zod'

const _logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])

type NodeEnv = 'development' | 'test' | 'production'

export interface RuntimeEnv {
  nodeEnv: NodeEnv
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
}

interface YamlConfigRaw {
  port?: number
  prefix?: string
  openapi?: {
    enabled?: boolean
    path?: string
    title?: string
    description?: string
    version?: string
  }
  logger?: {
    level?: z.infer<typeof _logLevelSchema>
    filePath?: string | null
  }
}

export type LogLevel = z.infer<typeof _logLevelSchema>
export type YamlConfig = YamlConfigRaw

function loadYaml(filePath: string): Record<string, unknown> {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  const text = readFileSync(abs, 'utf8')
  const doc = yamlLoad(text)
  return typeof doc === 'object' && doc !== null && !Array.isArray(doc) ? (doc as Record<string, unknown>) : {}
}

export function parseEnv<T>(schema: z.ZodType<T>, value: unknown, defaultValue: T): T {
  if (value === undefined || value === null || value === '') return defaultValue
  const result = schema.safeParse(value)
  return result.success ? result.data : defaultValue
}

export function parseOptionalEnv<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const result = schema.safeParse(value)
  return result.success ? result.data : undefined
}

export function parseRequiredEnv<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(`Environment variable validation failed: ${result.error.message}`)
  }
  return result.data
}

function normalizeNodeEnv(env: unknown): NodeEnv {
  const value = typeof env === 'string' ? env.trim().toLowerCase() : 'development'
  return value === 'production' || value === 'test' ? value : 'development'
}

export function getEnv(): RuntimeEnv {
  const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV)
  return {
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
  }
}

const CONFIG_PATH = process.env.CONFIG_PATH || 'config.yaml'

export const YAML_CONFIG: YamlConfig = existsSync(CONFIG_PATH) ? (loadYaml(CONFIG_PATH) as YamlConfig) : {}

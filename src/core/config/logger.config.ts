import type { LogLevel, YamlConfig } from './utils'
import { z } from 'zod'
import { parseEnv } from './utils'

export interface LoggerConfig {
  level: LogLevel
  filePath?: string
}

export function createLoggerConfig(isProd: boolean, yaml: YamlConfig): LoggerConfig {
  const levelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  const defaultLevel = isProd ? 'info' : 'debug'

  const level = parseEnv(levelSchema, yaml.logger?.level, defaultLevel)
  const filePath = yaml.logger?.filePath ?? undefined

  return {
    level,
    filePath,
  }
}

/**
 * 日志配置（供 pino 使用）
 * - level：日志级别，在生产默认使用 'info'，开发为 'debug'
 * - filePath：可选的日志文件路径，提供则启用文件日志
 */
import type { LogLevel, YamlConfig } from './utils'

export interface LoggerConfig {
  level: LogLevel
  filePath?: string
}

export function createLoggerConfig(isProd: boolean, yaml: YamlConfig): LoggerConfig {
  const baseLevel = yaml.logger_level ?? (isProd ? 'info' : 'debug')

  return {
    level: baseLevel,
    filePath: yaml.logger_file_path ?? undefined,
  }
}

/**
 * 日志系统核心实现
 *
 * 支持 DEBUG/INFO/WARN 三级日志
 * 支持环境变量控制日志级别
 */

import type { Logger, LoggerOptions, LogLevel } from './types.js'
import { LOG_LEVELS } from './types.js'

/**
 * 环境变量名：日志级别
 */
const ENV_LOG_LEVEL = 'XDD_CLIENT_LOG_LEVEL'

/**
 * 默认日志级别
 */
const DEFAULT_LOG_LEVEL: LogLevel = 'INFO'

/**
 * 默认是否启用
 */
const DEFAULT_ENABLED = true

/**
 * 从环境变量获取日志级别
 */
function getLogLevelFromEnv(): LogLevel | null {
  const envLevel = process.env[ENV_LOG_LEVEL]
  if (!envLevel) return null

  const upperLevel = envLevel.toUpperCase() as LogLevel
  if (upperLevel in LOG_LEVELS) {
    return upperLevel
  }

  return null
}

/**
 * 创建日志记录器
 *
 * @param options 日志配置选项
 * @returns 日志记录器实例
 *
 * @example
 * ```typescript
 * import { createLogger } from '@xdd-zone/client/logger'
 *
 * const logger = createLogger({ prefix: 'MyApp', level: 'DEBUG' })
 * logger.debug('Debug message')      // 输出
 * logger.info('Info message')         // 输出
 * logger.warn('Warning message')      // 输出
 *
 * // 禁用 DEBUG
 * logger.setLevel('INFO')
 * logger.debug('This will not output')
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  // 从环境变量获取日志级别，优先级高于代码配置
  const envLevel = getLogLevelFromEnv()
  const level = envLevel ?? options.level ?? DEFAULT_LOG_LEVEL
  const enabled = options.enabled ?? DEFAULT_ENABLED
  const prefix = options.prefix ?? ''

  let currentLevel = level
  let isEnabled = enabled

  /**
   * 检查是否可以输出指定级别的日志
   */
  function canLog(targetLevel: LogLevel): boolean {
    if (!isEnabled) return false
    return LOG_LEVELS[targetLevel] >= LOG_LEVELS[currentLevel]
  }

  /**
   * 格式化日志消息
   */
  function formatMessage(level: LogLevel, message: string, args: unknown[]): string {
    const timestamp = new Date().toISOString()
    const prefixStr = prefix ? `[${prefix}]` : ''
    const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : ''
    return `${timestamp} [${level}]${prefixStr} ${message}${argsStr}`
  }

  /**
   * 输出日志到控制台
   */
  function log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!canLog(level)) return

    const formattedMessage = formatMessage(level, message, args)

    if (level === 'WARN') {
      console.warn(formattedMessage)
    } else if (level === 'INFO') {
      console.info(formattedMessage)
    } else {
      console.log(formattedMessage)
    }
  }

  return {
    debug(message: string, ...args: unknown[]): void {
      log('DEBUG', message, ...args)
    },

    info(message: string, ...args: unknown[]): void {
      log('INFO', message, ...args)
    },

    warn(message: string, ...args: unknown[]): void {
      log('WARN', message, ...args)
    },

    setLevel(level: LogLevel): void {
      currentLevel = level
    },

    enable(): void {
      isEnabled = true
    },

    disable(): void {
      isEnabled = false
    },
  }
}

/**
 * 全局日志记录器实例
 * 默认前缀为 'XDDClient'
 */
let globalLogger: Logger | null = null

/**
 * 获取全局日志记录器
 *
 * @param options 日志配置选项（首次调用时生效）
 * @returns 全局日志记录器实例
 */
export function getLogger(options?: LoggerOptions): Logger {
  if (!globalLogger) {
    globalLogger = createLogger({
      ...options,
      prefix: options?.prefix ?? 'XDDClient',
    })
  }
  return globalLogger
}

/**
 * 设置全局日志级别
 *
 * @param level 新的日志级别
 */
export function setLogLevel(level: LogLevel): void {
  getLogger().setLevel(level)
}

/**
 * 启用日志输出
 */
export function enableLogger(): void {
  getLogger().enable()
}

/**
 * 禁用日志输出
 */
export function disableLogger(): void {
  getLogger().disable()
}

/**
 * 日志级别枚举导出
 */
export { LogLevel }

/**
 * 默认日志级别常量
 */
export const DEFAULT_LEVEL = DEFAULT_LOG_LEVEL

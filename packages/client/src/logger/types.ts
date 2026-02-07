/**
 * 日志系统类型定义
 *
 * 定义日志级别、配置接口和日志记录器接口
 */

/**
 * 日志级别
 *
 * 优先级从低到高：DEBUG < INFO < WARN
 * 只有当前日志级别 >= 配置级别时才会输出
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN'

/**
 * 日志级别映射表
 * 用于比较日志级别优先级
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
}

/**
 * 日志记录器接口
 */
export interface Logger {
  /** 输出 DEBUG 级别日志 */
  debug(message: string, ...args: unknown[]): void
  /** 输出 INFO 级别日志 */
  info(message: string, ...args: unknown[]): void
  /** 输出 WARN 级别日志 */
  warn(message: string, ...args: unknown[]): void
  /** 设置日志级别 */
  setLevel(level: LogLevel): void
  /** 启用日志输出 */
  enable(): void
  /** 禁用日志输出 */
  disable(): void
}

/**
 * 创建日志配置时的默认选项
 */
export interface LoggerOptions {
  /** 日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 日志前缀 */
  prefix?: string
}

import type { LoggerOptions } from 'pino'
import pino, { stdTimeFunctions } from 'pino'
import { LOGGER_CONFIG } from '@/core/config'
import { getEnv } from '@/core/config/utils'

// 根据 NODE_ENV 自动判断输出格式
const env = getEnv()

const options: LoggerOptions = {
  level: LOGGER_CONFIG.level,
  base: { service: 'xdd-server-elysia' },
  timestamp: stdTimeFunctions.isoTime,
  messageKey: 'msg',
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
}

const targets: any[] = []

// 控制台输出：开发环境使用 pretty 格式，生产使用 json
if (env.isDevelopment) {
  targets.push({
    target: 'pino-pretty',
    level: LOGGER_CONFIG.level,
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname,service',
    },
  })
} else {
  targets.push({
    target: 'pino/file',
    level: LOGGER_CONFIG.level,
    options: { destination: 1 }, // stdout
  })
}

// 文件输出：如果配置了 filePath 则启用
if (LOGGER_CONFIG.filePath) {
  targets.push({
    target: 'pino/file',
    level: LOGGER_CONFIG.level,
    options: { destination: LOGGER_CONFIG.filePath, mkdir: true },
  })
}

export const logger = pino(options, pino.transport({ targets }))

/**
 * 创建模块 logger
 * @param module 模块名称
 * @param context 额外的默认上下文
 * @returns 模块 logger
 */
export type Logger = typeof logger

export function createModuleLogger(module: string, context?: Record<string, unknown>) {
  return logger.child({ module, ...context })
}

import type { ResolvedConfig } from '@nexus/core/config'
import type { LoggerOptions, TransportMultiOptions } from 'pino'
import { CONFIG } from '@nexus/core/config'
import pino, { stdTimeFunctions } from 'pino'

interface LoggerConfig extends Pick<ResolvedConfig, 'logger'> {}

interface LoggerTransportTarget {
  target: string
  level: LoggerConfig['logger']['level']
  options?: Record<string, unknown>
}

function createLoggerTargets(config: LoggerConfig): LoggerTransportTarget[] {
  const targets: LoggerTransportTarget[] = []

  if (config.logger.pretty) {
    targets.push({
      target: 'pino-pretty',
      level: config.logger.level,
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
      level: config.logger.level,
      options: { destination: 1 },
    })
  }

  if (config.logger.filePath) {
    targets.push({
      target: 'pino/file',
      level: config.logger.level,
      options: { destination: config.logger.filePath, mkdir: true },
    })
  }

  return targets
}

export function createLogger(config: LoggerConfig = CONFIG) {
  const options: LoggerOptions = {
    level: config.logger.level,
    base: { service: config.logger.serviceName },
    timestamp: stdTimeFunctions.isoTime,
    messageKey: 'msg',
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  }

  return pino(
    options,
    pino.transport({
      targets: createLoggerTargets(config) as unknown as TransportMultiOptions<Record<string, unknown>>['targets'],
    }),
  )
}

/**
 * 创建应用级 logger。
 */
export type Logger = ReturnType<typeof createLogger>

export const logger = createLogger()

/**
 * 创建模块 logger。
 */
export function createModuleLogger(module: string, context?: Record<string, unknown>, baseLogger: Logger = logger) {
  return baseLogger.child({ module, ...context })
}

import type { MomoEnv } from '#momo/shared/env'
import type { Logger } from 'pino'
import { getStringProperty } from '#momo/shared/object-utils'
import pino from 'pino'

export type MomoLogger = Pick<Logger, 'debug' | 'error' | 'info' | 'warn'>
type BetterAuthLogLevel = 'debug' | 'error' | 'info' | 'warn'

export function createLogger(env: MomoEnv): Logger {
  const base = {
    env: env.APP_ENV,
    service: 'momo',
  }

  if (env.APP_ENV === 'test') {
    return pino({
      base,
      enabled: false,
      level: 'silent',
    })
  }

  if (env.APP_ENV === 'development') {
    return pino({
      base,
      level: env.LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname,env,service',
          singleLine: true,
          translateTime: 'SYS:standard',
        },
      },
    })
  }

  return pino({
    base,
    level: env.LOG_LEVEL,
  })
}

/** 创建带模块标识的子 logger，日志自动附带 module 字段 */
export function createChildLogger(parent: Logger, module: string): MomoLogger {
  return parent.child({ module })
}

export function createBetterAuthLogger(env: MomoEnv, logger: MomoLogger) {
  return {
    disabled: env.APP_ENV === 'test',
    disableColors: true,
    level: env.APP_ENV === 'development' ? 'debug' : 'warn',
    log(level: BetterAuthLogLevel, message: string, ...args: unknown[]) {
      const err = args.find((arg): arg is Error => arg instanceof Error)
      const payload = {
        event: 'better_auth.log',
        ...createErrorLogFields(err),
      }

      logger[level](payload, `Better Auth: ${message}`)
    },
  } as const
}

export function createErrorLogFields(error: Error | undefined) {
  if (!error) {
    return {}
  }

  const code = getStringProperty(error, 'code')
  const cause = getCause(error)
  const causeCode = cause ? getStringProperty(cause, 'code') : undefined

  return {
    causeCode,
    causeMessage: cause ? sanitizeErrorMessage(cause.message) : undefined,
    causeName: cause?.name,
    errorCode: code,
    errorMessage: sanitizeErrorMessage(error.message),
    errorName: error.name,
  }
}

function getCause(error: Error): Error | undefined {
  const cause = error.cause

  if (cause instanceof Error) {
    return cause
  }

  return undefined
}

function sanitizeErrorMessage(message: string): string {
  return message
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('params:'))
    .join('\n')
}

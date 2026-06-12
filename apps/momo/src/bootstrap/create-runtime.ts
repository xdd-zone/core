import type { Logger } from 'pino'
import { createLogger } from '#momo/infra/logger'
import { getMomoEnv } from '#momo/shared/env'

export interface MomoRuntime {
  env: ReturnType<typeof getMomoEnv>
  logger: Logger
}

export function createRuntime(): MomoRuntime {
  const env = getMomoEnv()

  return {
    env,
    logger: createLogger(env),
  }
}

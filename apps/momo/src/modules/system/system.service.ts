import type { HealthResponse, PingResponse, RootResponse } from '@xdd-zone/contracts'

import { getMomoEnv } from '#momo/shared/env'

export function getRootInfo(): RootResponse {
  return {
    name: '@xdd-zone/momo',
    status: 'ok',
  }
}

export function getHealthStatus(): HealthResponse {
  const env = getMomoEnv()

  return {
    env: env.APP_ENV,
    service: 'momo',
    status: 'ok',
  }
}

export function pingSystem(name: string): PingResponse {
  const env = getMomoEnv()

  return {
    env: env.APP_ENV,
    service: 'momo',
    message: `pong, ${name}`,
  }
}

import type { MomoEnv } from '#momo/shared/env'
import type { HealthResponse, PingResponse, RootResponse } from '@xdd-zone/contracts'

export function getRootInfo(): RootResponse {
  return {
    name: '@xdd-zone/momo',
    status: 'ok',
  }
}

export function getHealthStatus(env: MomoEnv): HealthResponse {
  return {
    env: env.APP_ENV,
    service: 'momo',
    status: 'ok',
  }
}

export function pingSystem(env: MomoEnv, name: string): PingResponse {
  return {
    env: env.APP_ENV,
    service: 'momo',
    message: `pong, ${name}`,
  }
}

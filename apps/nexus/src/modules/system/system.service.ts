import type { HealthResponse, PingResponse, RootResponse } from '@xdd-zone/contracts'

import { getNexusEnv } from '#nexus/shared/env'

export function getRootInfo(): RootResponse {
  return {
    name: '@xdd-zone/nexus',
    status: 'ok',
  }
}

export function getHealthStatus(): HealthResponse {
  const env = getNexusEnv()

  return {
    env: env.APP_ENV,
    service: 'nexus',
    status: 'ok',
  }
}

export function pingSystem(name: string): PingResponse {
  const env = getNexusEnv()

  return {
    env: env.APP_ENV,
    service: 'nexus',
    message: `pong, ${name}`,
  }
}

import type { AccessPluginInstance, AuthPluginInstance } from '@nexus/core/access'
import type { BetterAuthAdapter, BetterAuthInstance, SessionService } from '@nexus/core/auth'
import type { DeepPartial, ResolvedConfig } from '@nexus/core/config'
import type { Logger } from '@nexus/infra/logger'
import { createAccessPlugin, createAuthPlugin } from '@nexus/core/access'
import {
  createAuthApiService,
  createAuthMethodsService,
  createBetterAuthAdapter,
  createBetterAuthInstance,
  createSessionService,
} from '@nexus/core/auth'
import { CONFIG, createConfig } from '@nexus/core/config'
import { createLogger } from '@nexus/infra/logger'

export interface AppSecurityContext {
  accessPlugin: AccessPluginInstance
  authApiService: ReturnType<typeof createAuthApiService>
  authMethodsService: ReturnType<typeof createAuthMethodsService>
  authPlugin: AuthPluginInstance
  betterAuthAdapter: BetterAuthAdapter
  betterAuthInstance: BetterAuthInstance
  sessionService: SessionService
}

export interface AppBootstrapContext {
  config: ResolvedConfig
  logger: Logger
  security: AppSecurityContext
}

export function createAppContext(overrides?: DeepPartial<ResolvedConfig>): AppBootstrapContext {
  const config = overrides ? createConfig(overrides) : CONFIG
  const logger = createLogger(config)
  const betterAuthInstance = createBetterAuthInstance(config)
  const authMethodsService = createAuthMethodsService(config)
  const sessionService = createSessionService(betterAuthInstance)
  const betterAuthAdapter = createBetterAuthAdapter(betterAuthInstance)
  const authApiService = createAuthApiService(config, authMethodsService, betterAuthAdapter)
  const authPlugin = createAuthPlugin(sessionService)
  const accessPlugin = createAccessPlugin(sessionService)

  return {
    config,
    logger,
    security: {
      accessPlugin,
      authApiService,
      authMethodsService,
      authPlugin,
      betterAuthAdapter,
      betterAuthInstance,
      sessionService,
    },
  }
}

export const DEFAULT_APP_CONTEXT = createAppContext()

import type { YamlConfig } from './utils'

export type AuthMethodId = 'emailPassword' | 'github'
export type AuthMethodKind = 'credential' | 'oauth'

export interface AuthMethodPolicy {
  enabled: boolean
  allowSignUp: boolean
}

export interface AuthMethodsConfig {
  emailPassword: AuthMethodPolicy
  github: AuthMethodPolicy
}

export interface AuthConfig {
  methods: AuthMethodsConfig
}

const DEFAULT_AUTH_METHODS_CONFIG: AuthMethodsConfig = {
  emailPassword: {
    enabled: false,
    allowSignUp: false,
  },
  github: {
    enabled: true,
    allowSignUp: true,
  },
}

function resolveAuthMethodPolicy(
  policy: Partial<AuthMethodPolicy> | undefined,
  fallback: AuthMethodPolicy,
): AuthMethodPolicy {
  return {
    enabled: policy?.enabled ?? fallback.enabled,
    allowSignUp: policy?.allowSignUp ?? fallback.allowSignUp,
  }
}

/**
 * 认证方式开关配置。
 */
export function createAuthConfig(yamlConfig: YamlConfig): AuthConfig {
  const methods = yamlConfig.auth?.methods

  return {
    methods: {
      emailPassword: resolveAuthMethodPolicy(methods?.emailPassword, DEFAULT_AUTH_METHODS_CONFIG.emailPassword),
      github: resolveAuthMethodPolicy(methods?.github, DEFAULT_AUTH_METHODS_CONFIG.github),
    },
  }
}

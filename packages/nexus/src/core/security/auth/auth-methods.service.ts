import type { AuthMethodId, AuthMethodKind, AuthMethodPolicy, ResolvedConfig } from '@nexus/core/config'
import { BadRequestError } from '@nexus/core/http'

export interface PublicAuthMethod extends AuthMethodPolicy {
  entryPath: string | null
  id: AuthMethodId
  implemented: boolean
  kind: AuthMethodKind
}

const AUTH_METHOD_DISABLED_MESSAGES: Record<AuthMethodId, string> = {
  emailPassword: '邮箱密码登录当前未开启',
  github: 'GitHub 登录当前未开启',
  google: 'Google 登录当前未开启',
  wechat: '微信登录当前未开启',
}

const AUTH_METHOD_SIGN_UP_DISABLED_MESSAGES: Record<AuthMethodId, string> = {
  emailPassword: '邮箱密码注册当前未开启',
  github: 'GitHub 登录当前不允许首次创建用户',
  google: 'Google 登录当前不允许首次创建用户',
  wechat: '微信登录当前不允许首次创建用户',
}

interface AuthMethodMeta {
  entryPath: string | null
  id: AuthMethodId
  implemented: boolean
  kind: AuthMethodKind
}

/**
 * 登录方式规则服务。
 */
export interface AuthMethodsService {
  listPublicMethods: () => PublicAuthMethod[]
  getMethodPolicy: (methodId: AuthMethodId) => AuthMethodPolicy
  getMethodMeta: (methodId: AuthMethodId) => AuthMethodMeta
  isMethodEnabled: (methodId: AuthMethodId) => boolean
  canMethodSignUp: (methodId: AuthMethodId) => boolean
  assertMethodEnabled: (methodId: AuthMethodId) => void
  assertMethodSignUpAllowed: (methodId: AuthMethodId) => void
}

function createAuthMethodMetaList(config: Pick<ResolvedConfig, 'app'>): readonly AuthMethodMeta[] {
  return [
    {
      id: 'emailPassword',
      kind: 'credential',
      implemented: true,
      entryPath: `${config.app.apiPrefix}/auth/sign-in/email`,
    },
    {
      id: 'github',
      kind: 'oauth',
      implemented: true,
      entryPath: `${config.app.apiPrefix}/auth/sign-in/github`,
    },
    {
      id: 'google',
      kind: 'oauth',
      implemented: false,
      entryPath: null,
    },
    {
      id: 'wechat',
      kind: 'oauth',
      implemented: false,
      entryPath: null,
    },
  ] as const
}

export function createAuthMethodsService(config: Pick<ResolvedConfig, 'app' | 'auth'>): AuthMethodsService {
  const authMethodMetaList = createAuthMethodMetaList(config)
  const authMethodMetaMap: Record<AuthMethodId, AuthMethodMeta> = Object.fromEntries(
    authMethodMetaList.map((method) => [method.id, method]),
  ) as Record<AuthMethodId, AuthMethodMeta>

  function getMethodPolicy(methodId: AuthMethodId): AuthMethodPolicy {
    return config.auth.methods[methodId]
  }

  function getMethodMeta(methodId: AuthMethodId): AuthMethodMeta {
    return authMethodMetaMap[methodId]
  }

  function isMethodEnabled(methodId: AuthMethodId): boolean {
    return getMethodPolicy(methodId).enabled
  }

  function canMethodSignUp(methodId: AuthMethodId): boolean {
    const policy = getMethodPolicy(methodId)
    return policy.enabled && policy.allowSignUp
  }

  function assertMethodEnabled(methodId: AuthMethodId) {
    if (!isMethodEnabled(methodId)) {
      throw new BadRequestError(AUTH_METHOD_DISABLED_MESSAGES[methodId], 'AUTH_METHOD_DISABLED')
    }
  }

  function assertMethodSignUpAllowed(methodId: AuthMethodId) {
    if (!canMethodSignUp(methodId)) {
      throw new BadRequestError(AUTH_METHOD_SIGN_UP_DISABLED_MESSAGES[methodId], 'AUTH_SIGN_UP_DISABLED')
    }
  }

  return {
    listPublicMethods: () =>
      authMethodMetaList.map((methodMeta) => ({
        ...methodMeta,
        ...config.auth.methods[methodMeta.id],
      })),
    getMethodPolicy,
    getMethodMeta,
    isMethodEnabled,
    canMethodSignUp,
    assertMethodEnabled,
    assertMethodSignUpAllowed,
  }
}

import type { AuthMethodId, AuthMethodKind, AuthMethodPolicy } from '@nexus/core/config'
import { AUTH_CONFIG } from '@nexus/core/config'
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

const AUTH_METHOD_META_LIST: readonly AuthMethodMeta[] = [
  {
    id: 'emailPassword',
    kind: 'credential',
    implemented: true,
    entryPath: '/api/auth/sign-in/email',
  },
  {
    id: 'github',
    kind: 'oauth',
    implemented: true,
    entryPath: '/api/auth/sign-in/github',
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

const AUTH_METHOD_META_MAP: Record<AuthMethodId, AuthMethodMeta> = Object.fromEntries(
  AUTH_METHOD_META_LIST.map((method) => [method.id, method]),
) as Record<AuthMethodId, AuthMethodMeta>

/**
 * 登录方式规则服务。
 */
export class AuthMethodsService {
  /**
   * 返回当前公开可读的登录方式配置。
   */
  static listPublicMethods(): PublicAuthMethod[] {
    return AUTH_METHOD_META_LIST.map((methodMeta) => ({
      ...methodMeta,
      ...AUTH_CONFIG.methods[methodMeta.id],
    }))
  }

  /**
   * 读取指定登录方式配置。
   */
  static getMethodPolicy(methodId: AuthMethodId): AuthMethodPolicy {
    return AUTH_CONFIG.methods[methodId]
  }

  /**
   * 读取指定登录方式元信息。
   */
  static getMethodMeta(methodId: AuthMethodId): AuthMethodMeta {
    return AUTH_METHOD_META_MAP[methodId]
  }

  /**
   * 判断登录方式是否开启。
   */
  static isMethodEnabled(methodId: AuthMethodId): boolean {
    return this.getMethodPolicy(methodId).enabled
  }

  /**
   * 判断登录方式是否允许首次创建用户。
   */
  static canMethodSignUp(methodId: AuthMethodId): boolean {
    const policy = this.getMethodPolicy(methodId)
    return policy.enabled && policy.allowSignUp
  }

  /**
   * 要求当前登录方式处于开启状态。
   */
  static assertMethodEnabled(methodId: AuthMethodId) {
    if (!this.isMethodEnabled(methodId)) {
      throw new BadRequestError(AUTH_METHOD_DISABLED_MESSAGES[methodId], 'AUTH_METHOD_DISABLED')
    }
  }

  /**
   * 要求当前登录方式允许首次创建用户。
   */
  static assertMethodSignUpAllowed(methodId: AuthMethodId) {
    if (!this.canMethodSignUp(methodId)) {
      throw new BadRequestError(AUTH_METHOD_SIGN_UP_DISABLED_MESSAGES[methodId], 'AUTH_SIGN_UP_DISABLED')
    }
  }
}

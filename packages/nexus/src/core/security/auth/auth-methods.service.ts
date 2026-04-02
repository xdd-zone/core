import type { AuthMethodId, AuthMethodKind, AuthMethodPolicy } from '@nexus/core/config'
import { AUTH_CONFIG } from '@nexus/core/config'
import { BadRequestError } from '@nexus/core/http'

export interface PublicAuthMethod extends AuthMethodPolicy {
  id: AuthMethodId
  kind: AuthMethodKind
}

const AUTH_METHOD_KIND_MAP: Record<AuthMethodId, AuthMethodKind> = {
  emailPassword: 'credential',
  github: 'oauth',
}

const AUTH_METHOD_DISABLED_MESSAGES: Record<AuthMethodId, string> = {
  emailPassword: '邮箱密码登录当前未开启',
  github: 'GitHub 登录当前未开启',
}

const AUTH_METHOD_SIGN_UP_DISABLED_MESSAGES: Record<AuthMethodId, string> = {
  emailPassword: '邮箱密码注册当前未开启',
  github: 'GitHub 登录当前不允许首次创建用户',
}

/**
 * 登录方式规则服务。
 */
export class AuthMethodsService {
  /**
   * 返回当前公开可读的登录方式配置。
   */
  static listPublicMethods(): PublicAuthMethod[] {
    return (Object.keys(AUTH_CONFIG.methods) as AuthMethodId[]).map((methodId) => ({
      id: methodId,
      kind: AUTH_METHOD_KIND_MAP[methodId],
      ...AUTH_CONFIG.methods[methodId],
    }))
  }

  /**
   * 读取指定登录方式配置。
   */
  static getMethodPolicy(methodId: AuthMethodId): AuthMethodPolicy {
    return AUTH_CONFIG.methods[methodId]
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

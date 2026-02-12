/**
 * Auth 模块访问器
 *
 * 认证相关 API 操作的访问器实现
 */

import type { RequestFn } from '../../core/request'
import type { XDDResponse } from '../../core/types'
import type {
  SignInEmailBody,
  SignUpEmailBody,
  GetSessionResponse,
  SignOutResponse,
  AuthResponse,
} from '../../types/auth'

/**
 * Auth 模块访问器接口
 */
export interface AuthAccessors {
  signIn: {
    post(body: SignInEmailBody): Promise<XDDResponse<AuthResponse>>
  }
  signUp: {
    post(body: SignUpEmailBody): Promise<XDDResponse<AuthResponse>>
  }
  getSession: {
    get(): Promise<XDDResponse<GetSessionResponse>>
  }
  signOut: {
    post(): Promise<XDDResponse<SignOutResponse>>
  }
  me: {
    get(): Promise<XDDResponse<GetSessionResponse>>
  }
}

/**
 * 创建 Auth 模块访问器
 *
 * @param request - 统一请求函数
 * @returns Auth 访问器对象
 */
export function createAuthAccessor(request: RequestFn): AuthAccessors {
  return {
    signIn: {
      post: (body: SignInEmailBody) =>
        request<AuthResponse>('POST', 'auth/sign-in/email', { body: JSON.stringify(body) }),
    },
    signUp: {
      post: (body: SignUpEmailBody) =>
        request<AuthResponse>('POST', 'auth/sign-up/email', { body: JSON.stringify(body) }),
    },
    getSession: {
      get: () => request<GetSessionResponse>('GET', 'auth/get-session'),
    },
    signOut: {
      post: () => request<SignOutResponse>('POST', 'auth/sign-out'),
    },
    me: {
      get: () => request<GetSessionResponse>('GET', 'auth/me'),
    },
  }
}

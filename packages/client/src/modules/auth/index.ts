/**
 * Auth 模块访问器
 */

import {
  AuthSessionSchema,
  SessionSchema,
  SignInEmailBodySchema,
  SignUpEmailBodySchema,
} from '@xdd-zone/schema/contracts/auth'
import type { RequestFn } from '../../core/request'
import type { AuthSession, GetSessionResponse, SignInEmailBody, SignUpEmailBody } from '../../types/auth'

/**
 * Auth 模块访问器接口
 */
export interface AuthAccessors {
  signIn: {
    post(body: SignInEmailBody): Promise<AuthSession>
  }
  signUp: {
    post(body: SignUpEmailBody): Promise<AuthSession>
  }
  getSession: {
    get(): Promise<GetSessionResponse>
  }
  signOut: {
    post(): Promise<void>
  }
  me: {
    get(): Promise<GetSessionResponse>
  }
}

/**
 * 创建 Auth 模块访问器
 */
export function createAuthAccessor(request: RequestFn): AuthAccessors {
  return {
    signIn: {
      post: (body: SignInEmailBody) =>
        request<AuthSession>('POST', 'auth/sign-in/email', {
          body: SignInEmailBodySchema.parse(body),
          responseSchema: AuthSessionSchema,
        }),
    },
    signUp: {
      post: (body: SignUpEmailBody) =>
        request<AuthSession>('POST', 'auth/sign-up/email', {
          body: SignUpEmailBodySchema.parse(body),
          responseSchema: AuthSessionSchema,
        }),
    },
    getSession: {
      get: () => request<GetSessionResponse>('GET', 'auth/get-session', { responseSchema: SessionSchema }),
    },
    signOut: {
      post: () => request<void>('POST', 'auth/sign-out'),
    },
    me: {
      get: () => request<GetSessionResponse>('GET', 'auth/me', { responseSchema: SessionSchema }),
    },
  }
}

import type { AuthSession } from './types'
import { authPlugin } from '@nexus/core/access-control'
import { clearBetterAuthCookies, forwardBetterAuthResponse, revokeBetterAuthSession } from '@nexus/core/auth'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { AuthSessionSchema, SessionSchema, SignInEmailBodySchema, SignUpEmailBodySchema } from './model'
import { AuthService } from './service'

/**
 * 认证模块。
 */
export const authModule = new Elysia({
  name: 'auth-module',
  prefix: '/auth',
  tags: ['Auth'],
})
  .use(authPlugin)
  .post(
    '/sign-up/email',
    async ({ body, request, set }) =>
      AuthSessionSchema.parse(await forwardBetterAuthResponse<AuthSession>(request, { body, headers: set.headers })),
    {
      body: SignUpEmailBodySchema,
      response: AuthSessionSchema,
      detail: apiDetail({
        summary: '用户注册',
        description: '使用邮箱和密码注册新用户。注册成功后会返回用户信息和 token。',
        response: AuthSessionSchema,
        errors: [400],
      }),
    },
  )
  .post(
    '/sign-in/email',
    async ({ body, request, set }) =>
      AuthSessionSchema.parse(await forwardBetterAuthResponse<AuthSession>(request, { body, headers: set.headers })),
    {
      body: SignInEmailBodySchema,
      response: AuthSessionSchema,
      detail: apiDetail({
        summary: '用户登录',
        description: '使用邮箱和密码登录。登录成功后会自动设置 session cookie。',
        response: AuthSessionSchema,
        errors: [400],
      }),
    },
  )
  .post(
    '/sign-out',
    async ({ request, set }) => {
      await revokeBetterAuthSession(request)
      clearBetterAuthCookies(set.headers)

      set.status = 204
    },
    {
      detail: apiDetail({
        summary: '用户登出',
        description: '清除当前用户的 session cookie。',
        successStatus: 204,
        responseDescription: '登出成功',
      }),
    },
  )
  .get('/get-session', ({ auth }) => SessionSchema.parse(auth), {
    response: SessionSchema,
    detail: apiDetail({
      summary: '获取当前会话',
      description: '返回当前 cookie 对应的用户信息、会话详情和登录状态。',
      response: SessionSchema,
    }),
  })
  .get('/me', ({ auth }) => SessionSchema.parse(auth), {
    auth: 'required',
    response: SessionSchema,
    detail: apiDetail({
      summary: '获取当前用户信息',
      description: '返回当前登录用户的会话信息。',
      response: SessionSchema,
      errors: [401],
    }),
  })

export {
  type AuthSessionRecord,
  AuthSessionSchema,
  AuthUserSchema,
  SessionSchema,
  type SignInEmailBody,
  SignInEmailBodySchema,
  type SignUpEmailBody,
  SignUpEmailBodySchema,
} from './model'
export { AuthService }
export type { AuthenticatedSession, AuthSession, Session } from './types'

import type { AuthSession } from '@/modules/auth'
import { Elysia } from 'elysia'
import { authPlugin } from '@/core/access-control'
import { clearBetterAuthCookies, forwardBetterAuthResponse, revokeBetterAuthSession } from '@/core/auth'
import { AuthSessionSchema, SessionSchema, SignInEmailBodySchema, SignUpEmailBodySchema } from '@/modules/auth'
import { apiDetail } from '@/shared'

/**
 * 认证路由。
 */
export const authRoutes = new Elysia({
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
        description: '使用邮箱和密码登录。登录成功后会自动设置 session cookie（有效期 7 天）。',
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
        description: '清除当前用户的 session cookie',
        successStatus: 204,
        responseDescription: '登出成功',
      }),
    },
  )
  .get('/get-session', ({ auth }) => SessionSchema.parse(auth), {
    response: SessionSchema,
    detail: apiDetail({
      summary: '获取当前会话',
      description:
        '获取当前 session cookie 对应的用户信息和会话详情，并返回 isAuthenticated。未登录时返回 user/session 为 null。',
      response: SessionSchema,
    }),
  })
  .get('/me', ({ auth }) => SessionSchema.parse(auth), {
    auth: 'required',
    response: SessionSchema,
    detail: apiDetail({
      summary: '获取当前用户信息',
      description: '获取当前登录用户信息',
      response: SessionSchema,
      errors: [401],
    }),
  })

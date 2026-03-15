import { Elysia } from 'elysia'
import { BadRequestError } from '@/core/plugins'
import { auth } from '@/core/auth'
import { authPlugin, protectedPlugin } from '@/plugins'
import { apiDetail } from '@/shared'
import { AuthSessionSchema, SessionSchema, SignInEmailBodySchema, SignUpEmailBodySchema } from '@/modules/auth'

type MutableHeaders = Headers | Record<string, string | number | string[]>

/**
 * 将 Better Auth 响应转译成项目业务响应，并透传 Set-Cookie。
 */
async function wrapBetterAuthResponse<T>(request: Request, body?: unknown, headers?: MutableHeaders) {
  const authRequest =
    body !== undefined
      ? new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body),
        })
      : request

  const response = await auth.handler(authRequest)
  const data = (await response.json()) as T & { code?: string; message?: string }

  if (headers) {
    const cookie = response.headers.get('set-cookie')
    if (cookie) {
      if (headers instanceof Headers) {
        headers.set('Set-Cookie', cookie)
      } else {
        headers['Set-Cookie'] = cookie
      }
    }
  }

  if (typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string') {
    throw new BadRequestError(data.message || '操作失败')
  }

  return data as T
}

async function forwardBetterAuth(request: Request, headers?: MutableHeaders) {
  const response = await auth.handler(request)

  if (headers) {
    const cookie = response.headers.get('set-cookie')
    if (cookie) {
      if (headers instanceof Headers) {
        headers.set('Set-Cookie', cookie)
      } else {
        headers['Set-Cookie'] = cookie
      }
    }
  }

  if (!response.ok) {
    let message = '操作失败'
    try {
      const data = (await response.json()) as { message?: string; code?: string }
      if (data.code) {
        message = data.message || message
      }
    } catch {
      // ignore malformed error payload
    }

    throw new BadRequestError(message)
  }
}

/**
 * 认证路由。
 */
export const authRoutes = new Elysia({
  prefix: '/auth',
  tags: ['Auth'],
})
  .use(authPlugin)
  .post('/sign-up/email', async ({ body, request, set }) => await wrapBetterAuthResponse(request, body, set.headers), {
    body: SignUpEmailBodySchema,
    detail: apiDetail({
      summary: '用户注册',
      description: '使用邮箱和密码注册新用户。注册成功后会返回用户信息和 token。',
      response: AuthSessionSchema,
      errors: [400],
    }),
  })
  .post('/sign-in/email', async ({ body, request, set }) => await wrapBetterAuthResponse(request, body, set.headers), {
    body: SignInEmailBodySchema,
    detail: apiDetail({
      summary: '用户登录',
      description: '使用邮箱和密码登录。登录成功后会自动设置 session cookie（有效期 7 天）。',
      response: AuthSessionSchema,
      errors: [400],
    }),
  })
  .post(
    '/sign-out',
    async ({ request, set }) => {
      await forwardBetterAuth(request, set.headers)
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
  .get('/get-session', async ({ getAuth, request }) => await getAuth(request), {
    detail: apiDetail({
      summary: '获取当前会话',
      description:
        '获取当前 session cookie 对应的用户信息和会话详情，并返回 isAuthenticated。未登录时返回 user/session 为 null。',
      response: SessionSchema,
    }),
  })
  .group('', (app) =>
    app.use(protectedPlugin).get('/me', async ({ request, requireAuth }) => await requireAuth(request), {
      detail: apiDetail({
        summary: '获取当前用户信息',
        description: '获取当前登录用户信息',
        response: SessionSchema,
        errors: [401],
      }),
    }),
  )

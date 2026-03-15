import type { BetterAuthOptions } from 'better-auth'
import type { Session as PrismaSession } from '@/infra/database/prisma/generated'

import { Elysia } from 'elysia'
import { getCookieCache, getCookies } from 'better-auth/cookies'
import { BadRequestError } from '@/core/plugins'
import { auth } from '@/core/auth'
import { prisma } from '@/infra'
import { authPlugin, protectedPlugin } from '@/plugins'
import { apiDetail } from '@/shared'
import { AuthService } from '@/modules/auth/auth.service'
import { AuthSessionSchema, SessionSchema, SignInEmailBodySchema, SignUpEmailBodySchema } from '@/modules/auth'

type MutableHeaders = Headers | Record<string, string | number | string[]>
const betterAuthOptions = auth.options as BetterAuthOptions

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

/**
 * 向响应头追加 Set-Cookie，兼容 Headers 与普通对象两种写法。
 */
function appendSetCookie(headers: MutableHeaders | undefined, value: string) {
  if (!headers) {
    return
  }

  if (headers instanceof Headers) {
    headers.append('Set-Cookie', value)
    return
  }

  const currentValue = headers['Set-Cookie']

  if (Array.isArray(currentValue)) {
    headers['Set-Cookie'] = [...currentValue, value]
    return
  }

  if (typeof currentValue === 'string') {
    headers['Set-Cookie'] = [currentValue, value]
    return
  }

  headers['Set-Cookie'] = value
}

/**
 * 清理 Better Auth 相关 cookie，确保登出接口对已失效会话保持幂等。
 */
function clearBetterAuthCookies(headers?: MutableHeaders) {
  const cookies = getCookies(betterAuthOptions)

  appendSetCookie(headers, `${cookies.sessionToken.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
  appendSetCookie(headers, `${cookies.sessionData.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
  appendSetCookie(headers, `${cookies.dontRememberToken.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
}

interface CachedSessionPayload {
  session: PrismaSession & Record<string, unknown>
  user: {
    id: string
    createdAt: Date
    updatedAt: Date
    email: string
    emailVerified: boolean
    name: string
    image?: string | null
  } & Record<string, unknown>
  updatedAt: number
  version?: string
}

/**
 * 从请求中解析当前会话标识。
 *
 * 优先使用服务端实时会话，其次回退到 Better Auth 的 session_data cookie，
 * 以覆盖数据库记录已被级联删除但 cookie 尚未清理的场景。
 */
async function resolveSessionIdentifiers(request: Request) {
  const currentSession = await AuthService.getSession(request.headers)
  if (currentSession.session) {
    return {
      sessionId: currentSession.session.id,
      sessionToken: currentSession.session.token,
    }
  }

  const cachedSession = await getCookieCache<CachedSessionPayload>(request.headers, {
    cookiePrefix: betterAuthOptions.advanced?.cookiePrefix || 'better-auth',
    isSecure: getCookies(betterAuthOptions).sessionData.attributes.secure,
    secret: betterAuthOptions.secret,
    strategy: betterAuthOptions.session?.cookieCache?.strategy,
    version: betterAuthOptions.session?.cookieCache?.version,
  })

  return {
    sessionId: cachedSession?.session?.id ?? null,
    sessionToken: cachedSession?.session?.token ?? null,
  }
}

/**
 * 幂等删除会话。
 *
 * 当会话已被删除时，deleteMany 会返回 0，不会抛出 Prisma P2025。
 */
async function revokeSession(request: Request) {
  const { sessionId, sessionToken } = await resolveSessionIdentifiers(request)

  if (sessionId) {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
      },
    })
    return
  }

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        token: sessionToken,
      },
    })
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
      await revokeSession(request)
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

import type { Session as PrismaSession } from '@nexus/infra/database/prisma/generated'
import type { BetterAuthOptions } from 'better-auth'
import { BadRequestError } from '@nexus/core/http'
import { prisma } from '@nexus/infra'
import { getCookieCache, getCookies } from 'better-auth/cookies'
import { betterAuthInstance } from './better-auth'
import { SessionService } from './session.service'

type MutableHeaders = Headers | Record<string, string | number | string[]>

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

const betterAuthOptions = betterAuthInstance.options as BetterAuthOptions

/**
 * 向响应头追加 Set-Cookie。
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
 * 从请求中解析当前会话标识。
 */
async function resolveSessionIdentifiers(request: Request) {
  const currentSession = await SessionService.getSession(request.headers)
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
 * 将 Better Auth 响应转成项目接口响应，并透传 Set-Cookie。
 */
export async function forwardBetterAuthResponse<T>(
  request: Request,
  options?: {
    body?: unknown
    headers?: MutableHeaders
  },
): Promise<T> {
  const authRequest =
    options?.body !== undefined
      ? new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(options.body),
        })
      : request

  const response = await betterAuthInstance.handler(authRequest)
  const data = (await response.json()) as T & { code?: string; message?: string }

  const cookie = response.headers.get('set-cookie')
  if (cookie) {
    appendSetCookie(options?.headers, cookie)
  }

  if (typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string') {
    throw new BadRequestError(data.message || '操作失败')
  }

  return data as T
}

/**
 * 清理 Better Auth 相关 cookie。
 */
export function clearBetterAuthCookies(headers?: MutableHeaders) {
  const cookies = getCookies(betterAuthOptions)

  appendSetCookie(headers, `${cookies.sessionToken.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
  appendSetCookie(headers, `${cookies.sessionData.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
  appendSetCookie(headers, `${cookies.dontRememberToken.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
}

/**
 * 幂等删除 Better Auth 会话。
 */
export async function revokeBetterAuthSession(request: Request) {
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

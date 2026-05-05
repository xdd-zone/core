import type { Session as PrismaSession } from '@nexus-prisma/generated/client'
import type { BetterAuthOptions } from 'better-auth'
import type { BetterAuthInstance } from './better-auth'
import type { SessionService } from './session.service'
import { BadRequestError } from '@nexus/core/http'
import { prisma } from '@nexus/infra/database/client'
import { getCookieCache, getCookies, parseSetCookieHeader } from 'better-auth/cookies'

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

interface BetterAuthErrorPayload {
  code?: number | string
  errorCode?: string
  message?: string
}

function getSetCookieValues(headers: Headers): string[] {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
    return headersWithGetSetCookie.getSetCookie()
  }

  const cookie = headers.get('set-cookie')
  return cookie ? [cookie] : []
}

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

function getMutableSetCookieValues(headers: MutableHeaders | undefined): string[] {
  if (!headers) {
    return []
  }

  if (headers instanceof Headers) {
    return getSetCookieValues(headers)
  }

  const currentValue = headers['Set-Cookie'] ?? headers['set-cookie']

  if (Array.isArray(currentValue)) {
    return currentValue.map(String)
  }

  if (typeof currentValue === 'string') {
    return [currentValue]
  }

  return []
}

function normalizeSessionCookieToken(value: string | undefined): string | null {
  if (!value) {
    return null
  }

  let decodedValue = value
  try {
    decodedValue = decodeURIComponent(value)
  } catch {
    decodedValue = value
  }

  const token = decodedValue.split('.')[0]
  return token?.trim() ? token : null
}

function resolveSessionTokenFromSetCookie(headers: MutableHeaders | undefined, cookieName: string): string | null {
  for (const cookie of getMutableSetCookieValues(headers)) {
    const parsedCookie = parseSetCookieHeader(cookie)
    const value = parsedCookie.get(cookieName)?.value
    const token = normalizeSessionCookieToken(value)

    if (token) {
      return token
    }
  }

  return null
}

function resolveSessionTokenFromRequestCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    return null
  }

  const cookieMap = new Map(
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf('=')
        return separatorIndex > 0 ? [item.slice(0, separatorIndex), item.slice(separatorIndex + 1)] : [item, '']
      }),
  )

  return normalizeSessionCookieToken(cookieMap.get(cookieName))
}

function resolveBetterAuthErrorCode(payload: BetterAuthErrorPayload | null | undefined) {
  if (!payload) {
    return undefined
  }

  if (typeof payload.errorCode === 'string' && payload.errorCode) {
    return payload.errorCode
  }

  return typeof payload.code === 'string' && payload.code ? payload.code : undefined
}

async function resolveSessionIdentifiers(
  request: Request,
  betterAuthInstance: BetterAuthInstance,
  sessionService: SessionService,
) {
  const currentSession = await sessionService.getSession(request.headers)
  const betterAuthOptions = betterAuthInstance.options as BetterAuthOptions

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

export interface BetterAuthAdapter {
  clearBetterAuthCookies: (headers?: MutableHeaders) => void
  forwardBetterAuthRedirect: (request: Request, headers?: MutableHeaders) => Promise<string>
  forwardBetterAuthResponse: <T>(
    request: Request,
    options?: {
      body?: unknown
      headers?: MutableHeaders
    },
  ) => Promise<T>
  resolveBetterAuthSessionUserId: (request: Request, headers?: MutableHeaders) => Promise<string | null>
  revokeBetterAuthSession: (request: Request) => Promise<void>
}

export function createBetterAuthAdapter(
  betterAuthInstance: BetterAuthInstance,
  sessionService: SessionService,
): BetterAuthAdapter {
  const betterAuthOptions = betterAuthInstance.options as BetterAuthOptions

  return {
    async forwardBetterAuthResponse<T>(
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
      const data = (await response.json()) as T & BetterAuthErrorPayload

      for (const cookie of getSetCookieValues(response.headers)) {
        appendSetCookie(options?.headers, cookie)
      }

      if (!response.ok) {
        throw new BadRequestError(data.message || '操作失败', resolveBetterAuthErrorCode(data))
      }

      return data as T
    },

    async forwardBetterAuthRedirect(request: Request, headers?: MutableHeaders): Promise<string> {
      const response = await betterAuthInstance.handler(request)
      for (const cookie of getSetCookieValues(response.headers)) {
        appendSetCookie(headers, cookie)
      }

      const location = response.headers.get('location')
      if (location) {
        return location
      }

      let message = 'OAuth 重定向失败'
      let errorCode: string | undefined

      try {
        const data = (await response.json()) as BetterAuthErrorPayload
        if (data.message) {
          message = data.message
        }
        errorCode = resolveBetterAuthErrorCode(data)
      } catch {
        // no-op
      }

      throw new BadRequestError(message, errorCode)
    },

    clearBetterAuthCookies(headers?: MutableHeaders) {
      const cookies = getCookies(betterAuthOptions)

      appendSetCookie(headers, `${cookies.sessionToken.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
      appendSetCookie(headers, `${cookies.sessionData.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
      appendSetCookie(headers, `${cookies.dontRememberToken.name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`)
    },

    async resolveBetterAuthSessionUserId(request: Request, headers?: MutableHeaders): Promise<string | null> {
      const cookies = getCookies(betterAuthOptions)
      const sessionToken =
        resolveSessionTokenFromSetCookie(headers, cookies.sessionToken.name) ??
        resolveSessionTokenFromRequestCookie(request, cookies.sessionToken.name)

      if (!sessionToken) {
        return null
      }

      const session = await prisma.session.findUnique({
        where: {
          token: sessionToken,
        },
        select: {
          userId: true,
        },
      })

      return session?.userId ?? null
    },

    async revokeBetterAuthSession(request: Request) {
      const { sessionId, sessionToken } = await resolveSessionIdentifiers(request, betterAuthInstance, sessionService)

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
    },
  }
}

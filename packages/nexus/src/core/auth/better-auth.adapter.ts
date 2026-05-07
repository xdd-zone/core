import type { Session as PrismaSession } from '@nexus-prisma/generated/client'
import type { BetterAuthOptions } from 'better-auth'
import type { BetterAuthInstance } from './better-auth'
import type { AuthMutableHeaders, BetterAuthCookieService } from './cookie.service'
import { BadRequestError } from '@nexus/core/http'
import { prisma } from '@nexus/infra/database/client'
import { getCookieCache, getCookies } from 'better-auth/cookies'
import { createBetterAuthCookieService } from './cookie.service'

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
  cookieService: BetterAuthCookieService,
) {
  const betterAuthOptions = betterAuthInstance.options as BetterAuthOptions
  const sessionFromTokenCookie = await resolveSessionFromTokenCookie(request, cookieService)

  if (sessionFromTokenCookie.sessionId || sessionFromTokenCookie.sessionToken) {
    return sessionFromTokenCookie
  }

  return await resolveSessionFromCookieCache(request, betterAuthOptions)
}

async function resolveSessionFromTokenCookie(request: Request, cookieService: BetterAuthCookieService) {
  const requestSessionToken = cookieService.resolveSessionToken(request)

  if (!requestSessionToken) {
    return {
      sessionId: null,
      sessionToken: null,
    }
  }

  const session = await prisma.session.findUnique({
    where: {
      token: requestSessionToken,
    },
    select: {
      id: true,
      token: true,
    },
  })

  return {
    sessionId: session?.id ?? null,
    sessionToken: session?.token ?? requestSessionToken,
  }
}

async function resolveSessionFromCookieCache(request: Request, betterAuthOptions: BetterAuthOptions) {
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
  clearBetterAuthCookies: (headers?: AuthMutableHeaders) => void
  forwardBetterAuthRedirect: (request: Request, headers?: AuthMutableHeaders) => Promise<string>
  forwardBetterAuthResponse: <T>(
    request: Request,
    options?: {
      body?: unknown
      headers?: AuthMutableHeaders
    },
  ) => Promise<T>
  resolveBetterAuthSessionUserId: (request: Request, headers?: AuthMutableHeaders) => Promise<string | null>
  revokeBetterAuthSession: (request: Request) => Promise<void>
}

export function createBetterAuthAdapter(betterAuthInstance: BetterAuthInstance): BetterAuthAdapter {
  const betterAuthOptions = betterAuthInstance.options as BetterAuthOptions
  const cookieService = createBetterAuthCookieService(betterAuthOptions)

  return {
    async forwardBetterAuthResponse<T>(
      request: Request,
      options?: {
        body?: unknown
        headers?: AuthMutableHeaders
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

      cookieService.copySetCookies(response.headers, options?.headers)

      if (!response.ok) {
        throw new BadRequestError(data.message || '操作失败', resolveBetterAuthErrorCode(data))
      }

      return data as T
    },

    async forwardBetterAuthRedirect(request: Request, headers?: AuthMutableHeaders): Promise<string> {
      const response = await betterAuthInstance.handler(request)
      cookieService.copySetCookies(response.headers, headers)

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

    clearBetterAuthCookies(headers?: AuthMutableHeaders) {
      cookieService.clearBetterAuthCookies(headers)
    },

    async resolveBetterAuthSessionUserId(request: Request, headers?: AuthMutableHeaders): Promise<string | null> {
      const sessionToken = cookieService.resolveSessionToken(request, headers)

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
      const { sessionId, sessionToken } = await resolveSessionIdentifiers(request, betterAuthInstance, cookieService)

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

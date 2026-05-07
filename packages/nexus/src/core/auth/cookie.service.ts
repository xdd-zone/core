import type { BetterAuthOptions } from 'better-auth'
import { getCookies, parseSetCookieHeader } from 'better-auth/cookies'

export type AuthMutableHeaders = Headers | Record<string, string | number | string[]>

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

function appendSetCookie(headers: AuthMutableHeaders | undefined, value: string) {
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

  if (currentValue !== undefined) {
    headers['Set-Cookie'] = [String(currentValue), value]
    return
  }

  headers['Set-Cookie'] = value
}

function formatSameSite(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function serializeExpiredCookie(name: string, attributes: ReturnType<typeof getCookies>[keyof ReturnType<typeof getCookies>]['attributes']) {
  const parts = [`${name}=`, 'Max-Age=0']

  if (attributes.domain) {
    parts.push(`Domain=${attributes.domain}`)
  }

  if (attributes.path) {
    parts.push(`Path=${attributes.path}`)
  }

  if (attributes.httpOnly) {
    parts.push('HttpOnly')
  }

  if (attributes.secure) {
    parts.push('Secure')
  }

  if (attributes.sameSite) {
    parts.push(`SameSite=${formatSameSite(String(attributes.sameSite))}`)
  }

  if (attributes.partitioned) {
    parts.push('Partitioned')
  }

  return parts.join('; ')
}

function appendExpiredCookie(
  headers: AuthMutableHeaders | undefined,
  cookie: ReturnType<typeof getCookies>[keyof ReturnType<typeof getCookies>],
) {
  appendSetCookie(headers, serializeExpiredCookie(cookie.name, cookie.attributes))
}

function getMutableSetCookieValues(headers: AuthMutableHeaders | undefined): string[] {
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

  if (currentValue !== undefined) {
    return [String(currentValue)]
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

function resolveSessionTokenFromSetCookie(headers: AuthMutableHeaders | undefined, cookieName: string): string | null {
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

export interface BetterAuthCookieService {
  clearBetterAuthCookies: (headers?: AuthMutableHeaders) => void
  copySetCookies: (source: Headers, target?: AuthMutableHeaders) => void
  getMutableSetCookieValues: (headers?: AuthMutableHeaders) => string[]
  resolveSessionToken: (request: Request, headers?: AuthMutableHeaders) => string | null
}

export function createBetterAuthCookieService(options: BetterAuthOptions): BetterAuthCookieService {
  const cookies = getCookies(options)

  return {
    clearBetterAuthCookies(headers?: AuthMutableHeaders) {
      appendExpiredCookie(headers, cookies.sessionToken)
      appendExpiredCookie(headers, cookies.sessionData)
      appendExpiredCookie(headers, cookies.accountData)
      appendExpiredCookie(headers, cookies.dontRememberToken)
    },

    copySetCookies(source: Headers, target?: AuthMutableHeaders) {
      for (const cookie of getSetCookieValues(source)) {
        appendSetCookie(target, cookie)
      }
    },

    getMutableSetCookieValues,

    resolveSessionToken(request: Request, headers?: AuthMutableHeaders) {
      return (
        resolveSessionTokenFromSetCookie(headers, cookies.sessionToken.name) ??
        resolveSessionTokenFromRequestCookie(request, cookies.sessionToken.name)
      )
    },
  }
}

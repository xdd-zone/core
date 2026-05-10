import type { App } from '@nexus/public/eden'
import type { TestApp } from './app'

import { treaty } from '@elysiajs/eden'

export interface CookieFetcherSession {
  fetcher: typeof fetch
  setCookie: (name: string, value: string) => void
  getCookie: (name: string) => string | undefined
  clearCookies: () => void
}

export type TestEdenClient = ReturnType<typeof treaty<App>>

export interface CookieEdenClient {
  client: TestEdenClient
  session: CookieFetcherSession
}

function splitSetCookieHeader(cookieHeader: string): string[] {
  const cookies: string[] = []
  let startIndex = 0
  let inExpiresValue = false

  for (let index = 0; index < cookieHeader.length; index += 1) {
    const char = cookieHeader[index]
    const currentSlice = cookieHeader.slice(index)

    if (!inExpiresValue && currentSlice.toLowerCase().startsWith('expires=')) {
      inExpiresValue = true
      index += 'expires='.length - 1
      continue
    }

    if (inExpiresValue && char === ';') {
      inExpiresValue = false
      continue
    }

    if (!inExpiresValue && char === ',') {
      const nextSlice = cookieHeader.slice(index + 1)
      if (/^\s*[^=;,\s]+=/u.test(nextSlice)) {
        cookies.push(cookieHeader.slice(startIndex, index).trim())
        startIndex = index + 1
      }
    }
  }

  const lastCookie = cookieHeader.slice(startIndex).trim()
  if (lastCookie) {
    cookies.push(lastCookie)
  }

  return cookies
}

function getSetCookieValues(headers: Headers): string[] {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
    return headersWithGetSetCookie.getSetCookie()
  }

  const cookie = headers.get('set-cookie')
  return cookie ? splitSetCookieHeader(cookie) : []
}

function shouldDeleteCookie(attributes: string[]): boolean {
  for (const attribute of attributes) {
    const [rawName, rawValue = ''] = attribute.split('=')
    const name = rawName.trim().toLowerCase()
    const value = rawValue.trim()

    if (name === 'max-age') {
      const maxAge = Number(value)
      if (!Number.isNaN(maxAge) && maxAge <= 0) {
        return true
      }
    }

    if (name === 'expires') {
      const expiresAt = new Date(value)
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
        return true
      }
    }
  }

  return false
}

export function createCookieFetcher(app: TestApp): CookieFetcherSession {
  const cookies = new Map<string, string>()

  const fetcher = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      const cookieHeader = Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')

      if (cookieHeader) {
        headers.set('cookie', cookieHeader)
      }

      const request = new Request(input, {
        ...init,
        headers,
      })

      const response = await app.handle(request)

      for (const cookie of getSetCookieValues(response.headers)) {
        const [cookieNameValue = '', ...attributes] = cookie.split(';')
        const trimmedCookieNameValue = cookieNameValue.trim()
        if (!trimmedCookieNameValue) {
          continue
        }

        const separatorIndex = trimmedCookieNameValue.indexOf('=')
        if (separatorIndex <= 0) {
          continue
        }

        const name = trimmedCookieNameValue.slice(0, separatorIndex)
        const value = trimmedCookieNameValue.slice(separatorIndex + 1)

        if (shouldDeleteCookie(attributes)) {
          cookies.delete(name)
          continue
        }

        cookies.set(name, value)
      }

      return response
    },
    {
      preconnect: fetch.preconnect.bind(fetch),
    },
  ) as typeof fetch

  return {
    fetcher,
    setCookie(name: string, value: string) {
      cookies.set(name, value)
    },
    getCookie(name: string) {
      return cookies.get(name)
    },
    clearCookies() {
      cookies.clear()
    },
  }
}

export function createAnonymousClient(app: TestApp, baseUrl = 'http://localhost'): TestEdenClient {
  const fetcher = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init)
      return await app.handle(request)
    },
    {
      preconnect: fetch.preconnect.bind(fetch),
    },
  ) as typeof fetch

  return treaty<App>(baseUrl, {
    fetcher,
  })
}

export function createCookieClient(app: TestApp, baseUrl = 'http://localhost'): CookieEdenClient {
  const session = createCookieFetcher(app)
  const client = treaty<App>(baseUrl, {
    fetcher: session.fetcher,
  })

  return {
    client,
    session,
  }
}

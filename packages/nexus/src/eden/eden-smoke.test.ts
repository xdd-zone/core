import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { edenTreaty } from '@elysiajs/eden'
import { createApp } from '@/app'

const app = createApp()
app.listen(0)

const baseUrl = `http://localhost:${app.server?.port}`
const anonymousClient = edenTreaty<ReturnType<typeof createApp>>(baseUrl)

function createCookieFetcher() {
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

      const response = await fetch(input, {
        ...init,
        headers,
      })

      const responseHeaders = response.headers as Headers & {
        getSetCookie?: () => string[]
      }

      const setCookieHeaders =
        typeof responseHeaders.getSetCookie === 'function'
          ? responseHeaders.getSetCookie()
          : response.headers.get('set-cookie')
            ? [response.headers.get('set-cookie') as string]
            : []

      for (const cookie of setCookieHeaders) {
        const cookieNameValue = cookie.split(';')[0]?.trim()
        if (!cookieNameValue) {
          continue
        }

        const separatorIndex = cookieNameValue.indexOf('=')
        if (separatorIndex <= 0) {
          continue
        }

        const name = cookieNameValue.slice(0, separatorIndex)
        const value = cookieNameValue.slice(separatorIndex + 1)
        cookies.set(name, value)
      }

      return response
    },
    {
      preconnect: fetch.preconnect.bind(fetch),
    },
  ) as typeof fetch

  return fetcher
}

const authenticatedClient = edenTreaty<ReturnType<typeof createApp>>(baseUrl, {
  fetcher: createCookieFetcher(),
})

const tempSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const tempUser = {
  email: `eden-smoke-${tempSuffix}@example.com`,
  password: 'eden-smoke-pass-123',
  name: `Eden Smoke ${tempSuffix}`,
}

const emptyRequest = {
  $query: {},
  $headers: {},
} as const

let authenticatedUserId = ''

beforeAll(async () => {
  const result = await authenticatedClient.api.auth['sign-up'].email.post(tempUser)

  expect(result.status).toBe(200)
  expect(result.error).toBeNull()
  expect(result.data?.user?.id).toBeTruthy()

  authenticatedUserId = result.data!.user!.id
})

afterAll(async () => {
  if (authenticatedUserId) {
    await authenticatedClient.api.user[authenticatedUserId].delete(emptyRequest)
  }

  app.stop()
})

describe('eden smoke', () => {
  it('should access health route with typed response', async () => {
    const result = await anonymousClient.api.health.get(emptyRequest)

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      status: 'ok',
    })
  })

  it('should access anonymous session route with typed response', async () => {
    const result = await anonymousClient.api.auth['get-session'].get(emptyRequest)

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      user: null,
      session: null,
      isAuthenticated: false,
    })
  })

  it('should access authenticated me route with typed response', async () => {
    const result = await authenticatedClient.api.auth.me.get(emptyRequest)

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()
    expect(result.data?.isAuthenticated).toBe(true)
    expect(result.data?.user?.id).toBe(authenticatedUserId)
  })

  it('should access own routes with typed response', async () => {
    const userResult = await authenticatedClient.api.user[authenticatedUserId].get(emptyRequest)

    expect(userResult.status).toBe(200)
    expect(userResult.error).toBeNull()
    expect(userResult.data?.id).toBe(authenticatedUserId)

    const permissionsResult = await authenticatedClient.api.rbac.users[authenticatedUserId].permissions.get(emptyRequest)

    expect(permissionsResult.status).toBe(200)
    expect(permissionsResult.error).toBeNull()
    expect(Array.isArray(permissionsResult.data?.permissions)).toBe(true)
  })

  it('should access me routes with typed response', async () => {
    const rolesResult = await authenticatedClient.api.rbac.users.me.roles.get(emptyRequest)

    expect(rolesResult.status).toBe(200)
    expect(rolesResult.error).toBeNull()
    expect(Array.isArray(rolesResult.data?.roles)).toBe(true)

    const permissionsResult = await authenticatedClient.api.rbac.users.me.permissions.get(emptyRequest)

    expect(permissionsResult.status).toBe(200)
    expect(permissionsResult.error).toBeNull()
    expect(Array.isArray(permissionsResult.data?.permissions)).toBe(true)
  })
})

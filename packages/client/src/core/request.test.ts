import { afterEach, describe, expect, it } from 'bun:test'
import { createClient } from '../client'

const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout
const originalClearTimeout = globalThis.clearTimeout

afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
  globalThis.clearTimeout = originalClearTimeout
})

describe('client request defaults', () => {
  it('applies client default headers and timeout to requestRaw', async () => {
    const captured = {
      headers: {} as Record<string, string>,
      timeout: 0,
    }

    globalThis.setTimeout = ((_: TimerHandler, timeout?: number) => {
      captured.timeout = timeout ?? 0
      return 1 as unknown as ReturnType<typeof setTimeout>
    }) as unknown as typeof setTimeout
    globalThis.clearTimeout = (() => {}) as typeof clearTimeout
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured.headers = Object.fromEntries(new Headers(init?.headers).entries())
      return new Response('{}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })
    }) as typeof fetch

    const client = createClient({
      baseURL: 'http://localhost:7788/api',
      headers: {
        Authorization: 'Bearer default-token',
        'X-Client': 'xdd-client',
      },
      timeout: 1234,
    })

    await client.requestRaw('GET', 'health')

    expect(captured.timeout).toBe(1234)
    expect(captured.headers.authorization).toBe('Bearer default-token')
    expect(captured.headers['x-client']).toBe('xdd-client')
    expect(captured.headers.origin).toBe('http://localhost:7788')
    expect(captured.headers['content-type']).toBe('application/json')
  })

  it('keeps cookie and origin headers when interceptors append custom headers', async () => {
    const captured = {
      headers: {} as Record<string, string>,
    }

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured.headers = Object.fromEntries(new Headers(init?.headers).entries())
      return new Response(
        JSON.stringify({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      )
    }) as typeof fetch

    const client = createClient({
      baseURL: 'http://localhost:7788/api',
    })

    client.setCookie('session=abc123; Path=/; HttpOnly')
    client.onRequest((_method, _path, options) => ({
      ...options,
      headers: {
        ...(options.headers as Record<string, string> | undefined),
        Authorization: 'Bearer interceptor-token',
      },
    }))

    await client.user.list.get({ page: 1, pageSize: 20 })

    expect(captured.headers.authorization).toBe('Bearer interceptor-token')
    expect(captured.headers.cookie).toBe('session=abc123')
    expect(captured.headers.origin).toBe('http://localhost:7788')
    expect(captured.headers['content-type']).toBe('application/json')
  })

  it('allows per-request timeout to override client default timeout', async () => {
    let capturedTimeout = 0

    globalThis.setTimeout = ((_: TimerHandler, timeout?: number) => {
      capturedTimeout = timeout ?? 0
      return 1 as unknown as ReturnType<typeof setTimeout>
    }) as unknown as typeof setTimeout
    globalThis.clearTimeout = (() => {}) as typeof clearTimeout
    globalThis.fetch = (async () =>
      new Response('{}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })) as typeof fetch

    const client = createClient({
      baseURL: 'http://localhost:7788/api',
      timeout: 30000,
    })

    await client.requestRaw('GET', 'health', { timeout: 50 })

    expect(capturedTimeout).toBe(50)
  })
})

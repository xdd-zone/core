import type { ApiResponse } from '@xdd-zone/contracts'
import type { HonoEnv } from '#momo/shared/hono-env'
import { BizCode } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import app from '#momo/app'
import { registerRequestContext, registerTimeout, REQUEST_ID_HEADER } from '#momo/middleware'

describe('request pipeline 中间件', () => {
  it('cors 预检请求允许 x-request-id', async () => {
    const response = await app.request('/rpc/system/ping', {
      headers: {
        'access-control-request-headers': 'content-type,x-request-id',
        'access-control-request-method': 'POST',
        origin: 'http://localhost:2333',
      },
      method: 'OPTIONS',
    })

    expect(response.headers.get('access-control-allow-headers')).toContain('x-request-id')
  })

  it('cors 响应允许浏览器携带 cookie', async () => {
    const response = await app.request('/rpc/bobo/auth/me', {
      headers: {
        origin: 'http://localhost:2333',
      },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:2333')
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('expose x-request-id 给浏览器客户端', async () => {
    const response = await app.request('/health', {
      headers: {
        origin: 'http://localhost:2333',
        [REQUEST_ID_HEADER]: 'fifa-request-1',
      },
    })

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe('fifa-request-1')
    expect(response.headers.get('access-control-expose-headers')).toContain('x-request-id')
  })

  it('non-production 环境添加安全响应头但不添加 HSTS', async () => {
    const response = await app.request('/health')

    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('strict-transport-security')).toBeNull()
  })

  it('rpc 请求体过大时被拒绝', async () => {
    const response = await app.request('/rpc/system/ping', {
      body: 'a'.repeat(1024 * 1024 + 1),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(413)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_PAYLOAD_TOO_LARGE)
    expect(!body.ok && body.error.message).toBe('请求体过大')
  })

  it('auth 请求体过大时被拒绝', async () => {
    const response = await app.request('/api/auth/sign-in/email', {
      body: 'a'.repeat(64 * 1024 + 1),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(413)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_PAYLOAD_TOO_LARGE)
    expect(!body.ok && body.error.message).toBe('请求体过大')
  })

  it('LLM 生成接口使用更长超时时间', async () => {
    vi.useFakeTimers()

    try {
      const timeoutApp = new Hono<HonoEnv>()

      registerRequestContext(timeoutApp)
      registerTimeout(timeoutApp)
      timeoutApp.post('/rpc/content/posts/meta-suggestion', async () => {
        await new Promise(() => undefined)
        return new Response('never')
      })

      const responsePromise = Promise.resolve(timeoutApp.request('/rpc/content/posts/meta-suggestion', { method: 'POST' }))
      await vi.advanceTimersByTimeAsync(5000)

      let settled = false
      void responsePromise.then(() => {
        settled = true
      })
      await Promise.resolve()

      expect(settled).toBe(false)

      await vi.advanceTimersByTimeAsync(55000)
      const response = await responsePromise

      expect(response.status).toBe(504)
    } finally {
      vi.useRealTimers()
    }
  })

  it('auth 请求超时时返回 504', async () => {
    vi.useFakeTimers()

    try {
      const timeoutApp = new Hono<HonoEnv>()

      registerRequestContext(timeoutApp)
      registerTimeout(timeoutApp)
      timeoutApp.get('/api/auth/slow', async () => {
        await new Promise(() => undefined)
        return new Response('never')
      })

      const responsePromise = timeoutApp.request('/api/auth/slow')
      await vi.advanceTimersByTimeAsync(10_000)

      const response = await responsePromise

      expect(response.status).toBe(504)
    } finally {
      vi.useRealTimers()
    }
  })
})

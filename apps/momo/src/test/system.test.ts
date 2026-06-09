import type { ApiResponse, HealthResponse, PingResponse, RootResponse } from '@xdd-zone/contracts'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import app from '#momo/app'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it } from 'vitest'

const systemRoutePath = fileURLToPath(new URL('../modules/system/system.route.ts', import.meta.url))

describe('system routes', () => {
  it('uses zod validator middleware for ping request validation', async () => {
    const source = await readFile(systemRoutePath, 'utf8')

    expect(source).toContain('zValidator')
    expect(source).not.toContain('safeParse')
    expect(source).not.toContain('c.req.json()')
  })

  it('returns root service information', async () => {
    const response = await app.request('/')
    const body = (await response.json()) as ApiResponse<RootResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toEqual({
      name: '@xdd-zone/momo',
      status: 'ok',
    })
  })

  it('returns health status', async () => {
    const response = await app.request('/health')
    const body = (await response.json()) as ApiResponse<HealthResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toEqual({
      env: 'test',
      service: 'momo',
      status: 'ok',
    })
  })

  it('returns CORS header for an allowed origin', async () => {
    const response = await app.request('/health', {
      headers: {
        origin: 'http://localhost:2333',
      },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:2333')
  })

  it('returns ping response for a valid request', async () => {
    const response = await app.request('/rpc/system/ping', {
      body: JSON.stringify({ name: 'fifa' }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<PingResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toEqual({
      env: 'test',
      service: 'momo',
      message: 'pong, fifa',
    })
  })

  it('rejects invalid ping request body', async () => {
    const response = await app.request('/rpc/system/ping', {
      body: JSON.stringify({ name: '' }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<PingResponse>

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_INVALID_REQUEST)
  })

  it('returns not found response for unknown route', async () => {
    const response = await app.request('/unknown')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(404)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_NOT_FOUND)
  })
})

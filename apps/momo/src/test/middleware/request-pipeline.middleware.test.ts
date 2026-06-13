import type { ApiResponse } from '@xdd-zone/contracts'
import app from '#momo/app'
import { REQUEST_ID_HEADER } from '#momo/middleware'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it } from 'vitest'

describe('request pipeline middleware', () => {
  it('allows x-request-id in CORS preflight requests', async () => {
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

  it('exposes x-request-id to browser clients', async () => {
    const response = await app.request('/health', {
      headers: {
        origin: 'http://localhost:2333',
        [REQUEST_ID_HEADER]: 'fifa-request-1',
      },
    })

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe('fifa-request-1')
    expect(response.headers.get('access-control-expose-headers')).toContain('x-request-id')
  })

  it('adds security headers without HSTS outside production', async () => {
    const response = await app.request('/health')

    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('strict-transport-security')).toBeNull()
  })

  it('rejects oversized rpc request bodies', async () => {
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
})

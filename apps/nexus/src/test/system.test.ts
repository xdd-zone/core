import type { ApiResponse, HealthResponse, PingResponse, RootResponse } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it } from 'vitest'

import app from '../app'

describe('system routes', () => {
  it('returns root service information', async () => {
    const response = await app.request('/')
    const body = (await response.json()) as ApiResponse<RootResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toEqual({
      name: '@xdd-zone/nexus',
      status: 'ok',
    })
  })

  it('returns health status', async () => {
    const response = await app.request('/health')
    const body = (await response.json()) as ApiResponse<HealthResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toEqual({
      service: 'nexus',
      status: 'ok',
    })
  })

  it('returns ping response for a valid request', async () => {
    const response = await app.request('/rpc/system/ping', {
      body: JSON.stringify({ name: 'console' }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<PingResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data).toEqual({
      service: 'nexus',
      message: 'pong, console',
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

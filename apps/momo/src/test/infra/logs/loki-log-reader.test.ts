import type { ResolvedSystemLogQuery } from '#momo/infra/logs'
import { describe, expect, it, vi } from 'vitest'
import { buildLokiQuery, LokiLogReader } from '#momo/infra/logs'

const baseQuery: ResolvedSystemLogQuery = {
  from: '2026-01-01T00:00:00.000Z',
  limit: 2,
  minLevel: 'warn',
  rangeMinutes: 60,
  to: '2026-01-01T01:00:00.000Z',
}

describe('loki log reader', () => {
  it('使用固定字段生成 LogQL 并转义字符串', () => {
    const query = buildLokiQuery({
      ...baseQuery,
      event: 'http.request.completed',
      minDurationMs: 1000,
      module: 'http"} | line_format "secret',
      path: '/rpc/system/logs',
      requestId: 'request-1',
      statusFrom: 500,
      statusTo: 599,
    })

    expect(query).toContain('{service="momo"} | json | level >= 40')
    expect(query).toContain('| module = "http\\\"} | line_format \\"secret"')
    expect(query).toContain('| event = "http.request.completed"')
    expect(query).toContain('| requestId = "request-1"')
    expect(query).toContain('| status >= 500 | status <= 599')
    expect(query).toContain('| durationMs >= 1000')
  })

  it('解析多条 stream，按时间倒序返回并隐藏敏感字段', async () => {
    const longResponse = 'x'.repeat(2500)
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: {
          result: [
            {
              stream: { env: 'production', module: 'http', service: 'momo' },
              values: [
                [
                  '1767229200000000000',
                  JSON.stringify({
                    durationMs: 1200,
                    event: 'http.request.completed',
                    headers: { authorization: 'Bearer secret' },
                    level: 40,
                    msg: '请求耗时较长',
                    path: '/rpc/content/posts',
                    requestId: 'request-1',
                    responseBody: longResponse,
                    status: 200,
                  }),
                ],
              ],
            },
            {
              stream: { env: 'production', module: 'cache', service: 'momo' },
              values: [
                [
                  '1767229201000000000',
                  JSON.stringify({
                    errorMessage: 'connection failed',
                    event: 'cache.redis.error',
                    level: 50,
                    msg: 'Redis 缓存连接异常',
                    token: 'secret-token',
                  }),
                ],
              ],
            },
          ],
          resultType: 'streams',
        },
        status: 'success',
      }),
    ) as unknown as typeof fetch
    const reader = new LokiLogReader({ timeoutMs: 5000, url: 'http://localhost:53100' }, fetcher)

    const result = await reader.query(baseQuery)

    expect(result.logs.map((log) => log.event)).toEqual(['cache.redis.error', 'http.request.completed'])
    expect(result.logs[0]).toMatchObject({
      errorMessage: 'connection failed',
      level: 'error',
      module: 'cache',
    })
    expect(result.logs[0]?.context.token).toBe('[已隐藏]')
    expect(result.logs[1]?.context).toMatchObject({
      headers: { authorization: '[已隐藏]' },
    })
    expect(String(result.logs[1]?.context.responseBody)).toHaveLength(2003)
  })

  it('cursor 会保留同一时间戳中尚未返回的日志', async () => {
    const values = ['one', 'two', 'three'].map((message) => [
      '1767229200000000000',
      JSON.stringify({ event: message, level: 40, msg: message }),
    ])
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: {
          result: [{ stream: { service: 'momo' }, values }],
          resultType: 'streams',
        },
        status: 'success',
      }),
    ) as unknown as typeof fetch
    const reader = new LokiLogReader({ timeoutMs: 5000, url: 'http://localhost:53100' }, fetcher)

    const first = await reader.query(baseQuery)
    const second = await reader.query({ ...baseQuery, cursor: first.nextCursor! })

    expect(first.logs).toHaveLength(2)
    expect(first.nextCursor).not.toBeNull()
    expect(second.logs).toHaveLength(1)
    expect(new Set([...first.logs, ...second.logs].map((log) => log.event))).toEqual(new Set(['one', 'two', 'three']))
  })

  it('发送 Basic Auth 和 tenant header', async () => {
    const fetcher = vi.fn(async () => new Response('ready')) as unknown as typeof fetch
    const reader = new LokiLogReader(
      {
        password: 'password',
        tenantId: 'tenant-1',
        timeoutMs: 5000,
        url: 'http://localhost:53100',
        username: 'momo',
      },
      fetcher,
    )

    await reader.health()

    expect(fetcher).toHaveBeenCalledWith(
      new URL('http://localhost:53100/ready'),
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: `Basic ${Buffer.from('momo:password').toString('base64')}`,
          'x-scope-orgid': 'tenant-1',
        }),
      }),
    )
  })
})

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  })
}

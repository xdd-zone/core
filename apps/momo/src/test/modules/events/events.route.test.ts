import type { ApiResponse, EventOutboxDetailResponse, EventOutboxListResponse } from '@xdd-zone/contracts'
import type app from '#momo/app'
import { BizCode, EventOutboxDetailResponseSchema, EventOutboxListResponseSchema } from '@xdd-zone/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '#momo/infra/db/client'
import { eventOutbox } from '#momo/infra/db/schema/index'
import {
  bindFifaOwner,
  createCredentialUser,
  prepareAuthTestDatabase,
  resetAuthTestData,
  signInByEmail,
} from '#momo/test/helpers/auth-test-db'

let momoApp: typeof app
let ownerCookie: string

describe('events 路由', () => {
  beforeAll(async () => {
    await prepareAuthTestDatabase()
    momoApp = (await import('#momo/app')).default
  })

  beforeEach(async () => {
    await resetAuthTestData()
    await getDb().delete(eventOutbox)
    const owner = await createCredentialUser({ email: 'events-owner@example.com', name: 'Events Owner' })
    await bindFifaOwner(owner.id)
    ownerCookie = await signInByEmail(momoApp, owner.email)
  })

  afterAll(async () => {
    const { closeDb } = await import('#momo/infra/db/client')
    await closeDb()
  })

  it('未登录读取 outbox 被拒绝', async () => {
    const response = await momoApp.request('/rpc/events/outbox')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 owner 读取 outbox 被拒绝', async () => {
    const user = await createCredentialUser({ email: 'events-user@example.com', name: 'Events User' })
    const cookie = await signInByEmail(momoApp, user.email)
    const response = await momoApp.request('/rpc/events/outbox', { headers: { cookie } })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('按状态和事件类型读取 outbox 列表', async () => {
    await insertEvent({ id: 'failed-event', status: 'failed' })
    await insertEvent({ id: 'done-event', status: 'done' })

    const response = await momoApp.request(
      '/rpc/events/outbox?status=failed&eventType=system.test&page=1&pageSize=20',
      { headers: { cookie: ownerCookie } },
    )
    const body = (await response.json()) as ApiResponse<EventOutboxListResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    EventOutboxListResponseSchema.parse(data)
    expect(data.total).toBe(1)
    expect(data.events[0]).toMatchObject({ id: 'failed-event', status: 'failed' })
    expect(data.events[0]).not.toHaveProperty('payload')
  })

  it('读取 outbox 详情时返回 payload', async () => {
    await insertEvent({ id: 'detail-event', payload: { targetId: 'post-1' }, status: 'failed' })

    const response = await momoApp.request('/rpc/events/outbox/detail-event', {
      headers: { cookie: ownerCookie },
    })
    const body = (await response.json()) as ApiResponse<EventOutboxDetailResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    EventOutboxDetailResponseSchema.parse(data)
    expect(data.event.payload).toEqual({ targetId: 'post-1' })
  })

  it('单条重试后记录变为 done', async () => {
    await insertEvent({ id: 'retry-event', status: 'failed' })

    const response = await momoApp.request('/rpc/events/outbox/retry-event/retry', {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<{ event: { status: string } }>

    expect(response.status).toBe(200)
    expect(expectOkData(body).event.status).toBe('done')
  })
})

async function insertEvent(input: { id: string; payload?: Record<string, unknown>; status: 'done' | 'failed' }) {
  await getDb()
    .insert(eventOutbox)
    .values({
      errorMessage: input.status === 'failed' ? '测试失败' : null,
      eventType: 'system.test',
      id: input.id,
      payload: input.payload ?? {},
      status: input.status,
    })
}

function expectOkData<T>(body: ApiResponse<T>): T {
  expect(body.ok).toBe(true)
  if (!body.ok) throw new Error(body.error.message)
  return body.data
}

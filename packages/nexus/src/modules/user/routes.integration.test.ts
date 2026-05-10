import { Permissions } from '@nexus/core'
import { prisma } from '@nexus/infra/database'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  cleanupTestData,
  createCookieFetcher,
  createTestApp,
  createTestSuffix,
  createUserFixture,
  expectErrorResponse,
  grantPermissionsToUser,
  readJson,
  seedBasePermissions,
} from '../../test'

const { app } = createTestApp({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
  },
})

const createdUserIds: string[] = []
const createdRoleIds: string[] = []

function jsonRequest(path: string, body?: unknown, init: RequestInit = {}) {
  return new Request(new URL(path, 'http://localhost'), {
    ...init,
    body: body === undefined ? init.body : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  })
}

async function signUpSession(prefix: string) {
  const suffix = createTestSuffix(prefix)
  const session = createCookieFetcher(app)
  const response = await session.fetcher(new URL('/api/auth/sign-up/email', 'http://localhost'), {
    body: JSON.stringify({
      email: `${suffix}@example.com`,
      password: `${prefix}-pass-123`,
      name: `User Route ${suffix}`,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })
  const body = await readJson<{ user: { id: string; email?: string | null } }>(response)

  expect(response.status).toBe(200)
  createdUserIds.push(body.user.id)

  return {
    session,
    userId: body.user.id,
    email: body.user.email,
  }
}

beforeAll(async () => {
  await seedBasePermissions(prisma)
})

afterAll(async () => {
  await cleanupTestData({ userIds: createdUserIds, roleIds: createdRoleIds }, prisma)
})

describe('user routes', () => {
  it('GET /me 登录态返回当前用户资料', async () => {
    const actor = await signUpSession('user-me')
    const response = await actor.session.fetcher(new URL('/api/user/me', 'http://localhost'))
    const body = await readJson<{ id: string; email: string | null }>(response)

    expect(response.status).toBe(200)
    expect(body.id).toBe(actor.userId)
    expect(body.email).toBe(actor.email ?? null)
  })

  it('GET /me 未登录返回 401', async () => {
    const response = await app.handle(jsonRequest('/api/user/me'))

    await expectErrorResponse(response, {
      status: 401,
      message: '请先登录',
    })
  })

  it('PATCH /me 未登录返回 401', async () => {
    const response = await app.handle(jsonRequest('/api/user/me', { name: '匿名用户' }, { method: 'PATCH' }))

    await expectErrorResponse(response, {
      status: 401,
      message: '请先登录',
    })
  })

  it('PATCH /me 可以更新当前用户资料', async () => {
    const actor = await signUpSession('user-update-me')
    const response = await actor.session.fetcher(new URL('/api/user/me', 'http://localhost'), {
      body: JSON.stringify({
        name: '更新后的名字',
        introduce: '新的简介',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })
    const body = await readJson<{ id: string; name: string; introduce: string | null }>(response)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      id: actor.userId,
      name: '更新后的名字',
      introduce: '新的简介',
    })
  })

  it('PATCH /me 重复邮箱返回 409', async () => {
    const actor = await signUpSession('user-update-me-conflict')
    const duplicate = await createUserFixture(
      {
        suffix: createTestSuffix('user-update-me-conflict-target'),
        data: {
          email: `${createTestSuffix('dup-mail')}@example.com`,
        },
      },
      prisma,
    )
    createdUserIds.push(duplicate.id)

    const response = await actor.session.fetcher(new URL('/api/user/me', 'http://localhost'), {
      body: JSON.stringify({
        email: duplicate.email,
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 409,
      message: '邮箱已被其他用户使用',
      errorCode: 'CONFLICT',
    })
  })

  it('PATCH /me 重复用户名返回 409', async () => {
    const actor = await signUpSession('user-update-me-username-conflict')
    const duplicate = await createUserFixture(
      {
        suffix: createTestSuffix('user-update-me-username-target'),
        data: {
          username: createTestSuffix('duplicate-username'),
        },
      },
      prisma,
    )
    createdUserIds.push(duplicate.id)

    const response = await actor.session.fetcher(new URL('/api/user/me', 'http://localhost'), {
      body: JSON.stringify({
        username: duplicate.username,
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 409,
      message: '用户名已被其他用户使用',
      errorCode: 'CONFLICT',
    })
  })

  it('PATCH /me 重复手机号返回 409', async () => {
    const actor = await signUpSession('user-update-me-phone-conflict')
    const duplicate = await createUserFixture(
      {
        suffix: createTestSuffix('user-update-me-phone-target'),
        data: {
          phone: `138${Math.floor(Math.random() * 1_0000_0000)
            .toString()
            .padStart(8, '0')}`,
        },
      },
      prisma,
    )
    createdUserIds.push(duplicate.id)

    const response = await actor.session.fetcher(new URL('/api/user/me', 'http://localhost'), {
      body: JSON.stringify({
        phone: duplicate.phone,
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 409,
      message: '手机号已被其他用户使用',
      errorCode: 'CONFLICT',
    })
  })

  it('PATCH /me 非法请求体返回 422', async () => {
    const actor = await signUpSession('user-update-me-invalid')
    const response = await actor.session.fetcher(new URL('/api/user/me', 'http://localhost'), {
      body: JSON.stringify({
        email: 'invalid-email',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('PATCH /me/password 未登录返回 401', async () => {
    const response = await app.handle(
      jsonRequest('/api/user/me/password', { newPassword: 'new-password-123' }, { method: 'PATCH' }),
    )

    await expectErrorResponse(response, {
      status: 401,
      message: '请先登录',
    })
  })

  it('PATCH /me/password 首次设置密码成功', async () => {
    const actor = await signUpSession('user-password-set')
    await prisma.account.updateMany({
      where: {
        userId: actor.userId,
        providerId: 'credential',
      },
      data: {
        password: null,
      },
    })

    const response = await actor.session.fetcher(new URL('/api/user/me/password', 'http://localhost'), {
      body: JSON.stringify({
        newPassword: 'new-password-123',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })
    const body = await readJson<{ hasPassword: boolean }>(response)

    expect(response.status).toBe(200)
    expect(body).toEqual({
      hasPassword: true,
    })
  })

  it('PATCH /me/password 当前密码错误返回 400', async () => {
    const actor = await signUpSession('user-password-invalid-current')
    const response = await actor.session.fetcher(new URL('/api/user/me/password', 'http://localhost'), {
      body: JSON.stringify({
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 400,
      message: '当前密码不正确',
      errorCode: 'INVALID_CURRENT_PASSWORD',
    })
  })

  it('PATCH /me/password 缺当前密码返回 400', async () => {
    const actor = await signUpSession('user-password-required-current')
    const response = await actor.session.fetcher(new URL('/api/user/me/password', 'http://localhost'), {
      body: JSON.stringify({
        newPassword: 'new-password-123',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 400,
      message: '请输入当前密码',
      errorCode: 'CURRENT_PASSWORD_REQUIRED',
    })
  })

  it('PATCH /me/password 非法请求体返回 422', async () => {
    const actor = await signUpSession('user-password-invalid-body')
    const response = await actor.session.fetcher(new URL('/api/user/me/password', 'http://localhost'), {
      body: JSON.stringify({
        newPassword: 'short',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('后台列表、详情、状态、更新未登录均返回 401', async () => {
    const target = await createUserFixture({ suffix: createTestSuffix('user-anon-target') }, prisma)
    createdUserIds.push(target.id)

    const responses = await Promise.all([
      app.handle(jsonRequest('/api/user/')),
      app.handle(jsonRequest(`/api/user/${target.id}`)),
      app.handle(jsonRequest(`/api/user/${target.id}/status`, { status: 'INACTIVE' }, { method: 'PATCH' })),
      app.handle(jsonRequest(`/api/user/${target.id}`, { name: '未登录更新' }, { method: 'PATCH' })),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 401,
        message: '请先登录',
      })
    }
  })

  it('后台列表、详情、状态、更新无权限均返回 403', async () => {
    const actor = await signUpSession('user-forbidden')
    const target = await createUserFixture({ suffix: createTestSuffix('user-forbidden-target') }, prisma)
    createdUserIds.push(target.id)

    const responses = await Promise.all([
      actor.session.fetcher(new URL('/api/user/', 'http://localhost')),
      actor.session.fetcher(new URL(`/api/user/${target.id}`, 'http://localhost')),
      actor.session.fetcher(new URL(`/api/user/${target.id}/status`, 'http://localhost'), {
        body: JSON.stringify({ status: 'INACTIVE' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PATCH',
      }),
      actor.session.fetcher(new URL(`/api/user/${target.id}`, 'http://localhost'), {
        body: JSON.stringify({ name: '无权限更新' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PATCH',
      }),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 403,
        message: '权限不足',
      })
    }
  })

  it('后台列表、详情、状态、更新有权限均返回 200', async () => {
    const actor = await signUpSession('user-admin')
    const target = await createUserFixture({ suffix: createTestSuffix('user-admin-target') }, prisma)
    createdUserIds.push(target.id)

    const { role } = await grantPermissionsToUser(actor.userId, [
      Permissions.USER.READ_ALL,
      Permissions.USER.DISABLE_ALL,
      Permissions.USER.UPDATE_ALL,
    ])
    createdRoleIds.push(role.id)

    const listResponse = await actor.session.fetcher(new URL('/api/user/?page=1&pageSize=10', 'http://localhost'))
    const listBody = await readJson<{ items: Array<{ id: string }> }>(listResponse)
    expect(listResponse.status).toBe(200)
    expect(listBody.items.some((item) => item.id === target.id)).toBe(true)

    const detailResponse = await actor.session.fetcher(new URL(`/api/user/${target.id}`, 'http://localhost'))
    const detailBody = await readJson<{ id: string }>(detailResponse)
    expect(detailResponse.status).toBe(200)
    expect(detailBody.id).toBe(target.id)

    const statusResponse = await actor.session.fetcher(new URL(`/api/user/${target.id}/status`, 'http://localhost'), {
      body: JSON.stringify({ status: 'INACTIVE' }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })
    const statusBody = await readJson<{ id: string; status: string }>(statusResponse)
    expect(statusResponse.status).toBe(200)
    expect(statusBody).toMatchObject({
      id: target.id,
      status: 'INACTIVE',
    })

    const updateResponse = await actor.session.fetcher(new URL(`/api/user/${target.id}`, 'http://localhost'), {
      body: JSON.stringify({ name: '后台更新用户' }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })
    const updateBody = await readJson<{ id: string; name: string }>(updateResponse)
    expect(updateResponse.status).toBe(200)
    expect(updateBody).toMatchObject({
      id: target.id,
      name: '后台更新用户',
    })
  })

  it('后台更新不存在用户和更新不存在用户状态均返回 404', async () => {
    const actor = await signUpSession('user-admin-missing')
    const { role } = await grantPermissionsToUser(actor.userId, [Permissions.USER.DISABLE_ALL, Permissions.USER.UPDATE_ALL])
    createdRoleIds.push(role.id)
    const missingId = createTestSuffix('missing-user')

    const [statusResponse, updateResponse] = await Promise.all([
      actor.session.fetcher(new URL(`/api/user/${missingId}/status`, 'http://localhost'), {
        body: JSON.stringify({ status: 'INACTIVE' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PATCH',
      }),
      actor.session.fetcher(new URL(`/api/user/${missingId}`, 'http://localhost'), {
        body: JSON.stringify({ name: 'missing-user' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PATCH',
      }),
    ])

    await expectErrorResponse(statusResponse, {
      status: 404,
      message: '用户不存在',
      errorCode: 'NOT_FOUND',
    })
    await expectErrorResponse(updateResponse, {
      status: 404,
      message: '用户不存在',
      errorCode: 'NOT_FOUND',
    })
  })
})

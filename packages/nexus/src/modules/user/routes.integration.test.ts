import type { IntegrationActor } from '@nexus/test'

import { Permissions } from '@nexus/core'
import { prisma } from '@nexus/infra/database'
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import {
  createIntegrationTestContext,
  createTestSuffix,
  createUserFixture,
  expectErrorResponse,
  seedBasePermissions,
} from '../../test'

const integration = createIntegrationTestContext({
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

const anonymousRunner = integration.anonymous

interface UserResponseBody {
  createdAt: string
  deletedAt: string | null
  email: string | null
  emailVerified: boolean | null
  emailVerifiedAt: string | null
  id: string
  image: string | null
  introduce: string | null
  lastLogin: string | null
  lastLoginIp: string | null
  name: string
  phone: string | null
  phoneVerified: boolean | null
  phoneVerifiedAt: string | null
  status: string
  updatedAt: string
  username: string | null
}

interface UserListBody {
  items: UserResponseBody[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

function jsonRequest(path: string, body?: unknown, init: RequestInit = {}) {
  return anonymousRunner(path, {
    ...init,
    body: body === undefined ? init.body : JSON.stringify(body),
    headers: integration.jsonHeaders(init.headers),
  })
}

function expectUserContract(
  body: UserResponseBody,
  expected: Partial<Pick<UserResponseBody, 'email' | 'id' | 'introduce' | 'name' | 'phone' | 'status' | 'username'>>,
) {
  expect(body).toMatchObject(expected)
  expect(typeof body.createdAt).toBe('string')
  expect(typeof body.updatedAt).toBe('string')
  expect(body).toHaveProperty('deletedAt')
  expect(body).toHaveProperty('emailVerified')
  expect(body).toHaveProperty('emailVerifiedAt')
  expect(body).toHaveProperty('image')
  expect(body).toHaveProperty('lastLogin')
  expect(body).toHaveProperty('lastLoginIp')
  expect(body).toHaveProperty('phoneVerified')
  expect(body).toHaveProperty('phoneVerifiedAt')
}

async function patchJson(actor: IntegrationActor, path: string, body: unknown) {
  return await actor(path, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
    method: 'PATCH',
  })
}

async function createSessionActor(prefix: string) {
  const actor = await integration.actor([], { prefix, name: `User Route ${createTestSuffix(prefix)}` })
  const { body } = await integration.json<UserResponseBody>('/api/user/me', {}, actor)

  return Object.assign(actor, {
    email: body.email,
    profile: body,
  })
}

async function createTrackedUserFixture(
  suffix: string,
  data: NonNullable<Parameters<typeof createUserFixture>[0]>['data'] = {},
) {
  const user = await createUserFixture(
    {
      suffix: createTestSuffix(suffix),
      data,
    },
    prisma,
  )
  integration.track.userId(user.id)
  return user
}

beforeAll(async () => {
  await seedBasePermissions(prisma)
})

afterEach(async () => {
  await integration.cleanup()
})

describe('user routes', () => {
  describe('当前用户资料', () => {
    it('GET /me 登录态返回当前用户资料', async () => {
      const actor = await createSessionActor('user-me')
      const { response, body } = await integration.json<UserResponseBody>('/api/user/me', {}, actor)

      expect(response.status).toBe(200)
      expectUserContract(body, {
        email: actor.email ?? null,
        id: actor.userId,
        name: actor.profile.name,
        status: actor.profile.status,
      })
    })

    it('GET /me 未登录返回 401', async () => {
      const response = await jsonRequest('/api/user/me')

      await expectErrorResponse(response, {
        status: 401,
        message: '请先登录',
      })
    })

    it('PATCH /me 未登录返回 401', async () => {
      const response = await jsonRequest('/api/user/me', { name: '匿名用户' }, { method: 'PATCH' })

      await expectErrorResponse(response, {
        status: 401,
        message: '请先登录',
      })
    })

    it('PATCH /me 可以更新当前用户资料', async () => {
      const actor = await createSessionActor('user-update-me')
      const response = await patchJson(actor, '/api/user/me', {
        name: '更新后的名字',
        introduce: '新的简介',
      })
      const body = (await response.json()) as UserResponseBody

      expect(response.status).toBe(200)
      expectUserContract(body, {
        email: actor.email ?? null,
        id: actor.userId,
        introduce: '新的简介',
        name: '更新后的名字',
        status: actor.profile.status,
      })
    })

    it('PATCH /me 重复邮箱返回 409', async () => {
      const actor = await createSessionActor('user-update-me-conflict')
      const duplicate = await createTrackedUserFixture('user-update-me-conflict-target', {
        email: `${createTestSuffix('dup-mail')}@example.com`,
      })

      const response = await patchJson(actor, '/api/user/me', {
        email: duplicate.email,
      })

      await expectErrorResponse(response, {
        status: 409,
        message: '邮箱已被其他用户使用',
        errorCode: 'CONFLICT',
      })
    })

    it('PATCH /me 重复用户名返回 409', async () => {
      const actor = await createSessionActor('user-update-me-username-conflict')
      const duplicate = await createTrackedUserFixture('user-update-me-username-target', {
        username: createTestSuffix('duplicate-username'),
      })

      const response = await patchJson(actor, '/api/user/me', {
        username: duplicate.username,
      })

      await expectErrorResponse(response, {
        status: 409,
        message: '用户名已被其他用户使用',
        errorCode: 'CONFLICT',
      })
    })

    it('PATCH /me 重复手机号返回 409', async () => {
      const actor = await createSessionActor('user-update-me-phone-conflict')
      const duplicate = await createTrackedUserFixture('user-update-me-phone-target', {
        phone: `138${Math.floor(Math.random() * 1_0000_0000)
          .toString()
          .padStart(8, '0')}`,
      })

      const response = await patchJson(actor, '/api/user/me', {
        phone: duplicate.phone,
      })

      await expectErrorResponse(response, {
        status: 409,
        message: '手机号已被其他用户使用',
        errorCode: 'CONFLICT',
      })
    })

    it('PATCH /me 非法请求体返回 422', async () => {
      const actor = await createSessionActor('user-update-me-invalid')
      const response = await patchJson(actor, '/api/user/me', {
        email: 'invalid-email',
      })

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })
  })

  describe('密码修改', () => {
    it('PATCH /me/password 未登录返回 401', async () => {
      const response = await jsonRequest(
        '/api/user/me/password',
        { newPassword: 'new-password-123' },
        { method: 'PATCH' },
      )

      await expectErrorResponse(response, {
        status: 401,
        message: '请先登录',
      })
    })

    it('PATCH /me/password 首次设置密码成功', async () => {
      const actor = await createSessionActor('user-password-set')
      await prisma.account.updateMany({
        where: {
          providerId: 'credential',
          userId: actor.userId,
        },
        data: {
          password: null,
        },
      })

      const response = await patchJson(actor, '/api/user/me/password', {
        newPassword: 'new-password-123',
      })
      const body = (await response.json()) as { hasPassword: boolean }

      expect(response.status).toBe(200)
      expect(body).toEqual({
        hasPassword: true,
      })
    })

    it('PATCH /me/password 当前密码错误返回 400', async () => {
      const actor = await createSessionActor('user-password-invalid-current')
      const response = await patchJson(actor, '/api/user/me/password', {
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123',
      })

      await expectErrorResponse(response, {
        status: 400,
        message: '当前密码不正确',
        errorCode: 'INVALID_CURRENT_PASSWORD',
      })
    })

    it('PATCH /me/password 缺当前密码返回 400', async () => {
      const actor = await createSessionActor('user-password-required-current')
      const response = await patchJson(actor, '/api/user/me/password', {
        newPassword: 'new-password-123',
      })

      await expectErrorResponse(response, {
        status: 400,
        message: '请输入当前密码',
        errorCode: 'CURRENT_PASSWORD_REQUIRED',
      })
    })

    it('PATCH /me/password 非法请求体返回 422', async () => {
      const actor = await createSessionActor('user-password-invalid-body')
      const response = await patchJson(actor, '/api/user/me/password', {
        newPassword: 'short',
      })

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })
  })

  describe('后台用户管理', () => {
    it('后台列表、详情、状态、更新未登录均返回 401', async () => {
      const target = await createTrackedUserFixture('user-anon-target')

      const responses = await Promise.all([
        jsonRequest('/api/user/'),
        jsonRequest(`/api/user/${target.id}`),
        jsonRequest(`/api/user/${target.id}/status`, { status: 'INACTIVE' }, { method: 'PATCH' }),
        jsonRequest(`/api/user/${target.id}`, { name: '未登录更新' }, { method: 'PATCH' }),
      ])

      for (const response of responses) {
        await expectErrorResponse(response, {
          status: 401,
          message: '请先登录',
        })
      }
    })

    it('后台列表、详情、状态、更新无权限均返回 403', async () => {
      const actor = await createSessionActor('user-forbidden')
      const target = await createTrackedUserFixture('user-forbidden-target')

      const responses = await Promise.all([
        actor('/api/user/'),
        actor(`/api/user/${target.id}`),
        patchJson(actor, `/api/user/${target.id}/status`, { status: 'INACTIVE' }),
        patchJson(actor, `/api/user/${target.id}`, { name: '无权限更新' }),
      ])

      for (const response of responses) {
        await expectErrorResponse(response, {
          status: 403,
          message: '权限不足',
        })
      }
    })

    it('后台列表、详情、状态、更新有权限均返回完整契约', async () => {
      const target = await createTrackedUserFixture('user-admin-target')
      const admin = await integration.actor(
        [Permissions.USER.READ_ALL, Permissions.USER.DISABLE_ALL, Permissions.USER.UPDATE_ALL],
        { prefix: 'user-admin' },
      )

      const listResponse = await admin('/api/user/?page=1&pageSize=10')
      const listBody = (await listResponse.json()) as UserListBody
      expect(listResponse.status).toBe(200)
      expect(listBody).toMatchObject({
        page: 1,
        pageSize: 10,
      })
      expect(typeof listBody.total).toBe('number')
      expect(typeof listBody.totalPages).toBe('number')
      expect(listBody.items.some((item) => item.id === target.id)).toBe(true)

      const detailResponse = await admin(`/api/user/${target.id}`)
      const detailBody = (await detailResponse.json()) as UserResponseBody
      expect(detailResponse.status).toBe(200)
      expectUserContract(detailBody, {
        email: target.email,
        id: target.id,
        name: target.name,
        status: target.status,
        username: target.username,
      })

      const updateResponse = await patchJson(admin, `/api/user/${target.id}`, { name: '后台更新用户' })
      const updateBody = (await updateResponse.json()) as UserResponseBody
      expect(updateResponse.status).toBe(200)
      expectUserContract(updateBody, {
        email: target.email,
        id: target.id,
        name: '后台更新用户',
        status: target.status,
        username: target.username,
      })
    })

    it('后台更新不存在用户和更新不存在用户状态均返回 404', async () => {
      const actor = await integration.actor([Permissions.USER.DISABLE_ALL, Permissions.USER.UPDATE_ALL], {
        prefix: 'user-admin-missing',
      })
      const missingId = createTestSuffix('missing-user')

      const [statusResponse, updateResponse] = await Promise.all([
        patchJson(actor, `/api/user/${missingId}/status`, {
          status: 'INACTIVE',
        }),
        patchJson(actor, `/api/user/${missingId}`, {
          name: 'missing-user',
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

  describe('状态修改', () => {
    it('PATCH /:id/status 有权限时返回更新后的用户状态契约', async () => {
      const target = await createTrackedUserFixture('user-status-target')
      const actor = await integration.actor([Permissions.USER.DISABLE_ALL], {
        prefix: 'user-status-admin',
      })

      const response = await patchJson(actor, `/api/user/${target.id}/status`, {
        status: 'INACTIVE',
      })
      const body = (await response.json()) as UserResponseBody

      expect(response.status).toBe(200)
      expectUserContract(body, {
        email: target.email,
        id: target.id,
        name: target.name,
        status: 'INACTIVE',
        username: target.username,
      })
    })
  })
})

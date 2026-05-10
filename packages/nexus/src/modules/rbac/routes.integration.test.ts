import { Permissions } from '@nexus/core'
import { prisma } from '@nexus/infra/database'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  createIntegrationTestContext,
  createTestSuffix,
  createUserFixture,
  expectErrorResponse,
  expectNoBody,
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
const createActorWithPermissions = integration.actor

beforeAll(async () => {
  await seedBasePermissions(prisma)
})

afterAll(async () => {
  await integration.cleanup()
})

describe('rbac routes', () => {
  it('GET /roles 返回角色列表', async () => {
    const actor = await createActorWithPermissions([Permissions.ROLE.READ_ALL], {
      prefix: 'rbac-actor',
      assignedBy: 'self',
    })
    const { response, body } = await integration.json<{ items: Array<{ name: string }> }>(
      '/api/rbac/roles?page=1&pageSize=20',
      {},
      actor,
    )

    expect(response.status).toBe(200)
    expect(body.items.some((role) => role.name === 'superAdmin')).toBe(true)
    expect(body.items.some((role) => role.name === 'user')).toBe(true)
  })

  it('RBAC 后台接口未登录时返回 401', async () => {
    const target = await createUserFixture({ suffix: createTestSuffix('rbac-anon-target') }, prisma)
    integration.track.userId(target.id)

    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const responses = await Promise.all([
      anonymousRunner('/api/rbac/roles'),
      anonymousRunner(`/api/rbac/users/${target.id}/roles`),
      anonymousRunner(`/api/rbac/users/${target.id}/roles`, {
        body: JSON.stringify({ roleId: role.id }),
        headers: integration.jsonHeaders(),
        method: 'POST',
      }),
      anonymousRunner(`/api/rbac/users/${target.id}/roles/${role.id}`, { method: 'DELETE' }),
      anonymousRunner(`/api/rbac/users/${target.id}/permissions`),
      anonymousRunner('/api/rbac/users/me/permissions'),
      anonymousRunner('/api/rbac/users/me/roles'),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 401,
      })
    }
  })

  it('RBAC 后台接口无权限时返回 403', async () => {
    const actor = await integration.actor([], { prefix: 'rbac-forbidden' })
    const target = await createUserFixture({ suffix: createTestSuffix('rbac-forbidden-target') }, prisma)
    integration.track.userId(target.id)

    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const responses = await Promise.all([
      actor('/api/rbac/roles'),
      actor(`/api/rbac/users/${target.id}/roles`),
      actor(`/api/rbac/users/${target.id}/roles`, {
        body: JSON.stringify({ roleId: role.id }),
        headers: integration.jsonHeaders(),
        method: 'POST',
      }),
      actor(`/api/rbac/users/${target.id}/roles/${role.id}`, {
        method: 'DELETE',
      }),
      actor(`/api/rbac/users/${target.id}/permissions`),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 403,
      })
    }
  })

  it('可以给用户分配角色并移除，移除返回 204 空 body', async () => {
    const actor = await createActorWithPermissions(
      [Permissions.ROLE.READ_ALL, Permissions.USER_ROLE.ASSIGN_ALL, Permissions.USER_ROLE.REVOKE_ALL],
      { prefix: 'rbac-actor', assignedBy: 'self' },
    )
    const target = await createUserFixture({ suffix: createTestSuffix('rbac-target') }, prisma)
    integration.track.userId(target.id)

    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const { response: assignResponse, body: assignBody } = await integration.json<{
      userId: string
      roleId: string
      assignedBy: string | null
    }>(
      `/api/rbac/users/${target.id}/roles`,
      {
        body: JSON.stringify({ roleId: role.id }),
        headers: integration.jsonHeaders(),
        method: 'POST',
      },
      actor,
    )

    expect(assignResponse.status).toBe(200)
    expect(assignBody).toMatchObject({
      userId: target.id,
      roleId: role.id,
      assignedBy: actor.userId,
    })

    const { response: rolesResponse, body: rolesBody } = await integration.json<
      Array<{ roleId: string; roleName: string }>
    >(`/api/rbac/users/${target.id}/roles`, {}, actor)

    expect(rolesResponse.status).toBe(200)
    expect(rolesBody).toContainEqual(
      expect.objectContaining({
        roleId: role.id,
        roleName: 'user',
      }),
    )

    const removeResponse = await actor(`/api/rbac/users/${target.id}/roles/${role.id}`, {
      method: 'DELETE',
    })

    await expectNoBody(removeResponse)
  })

  it('GET /users/me/permissions 返回当前用户权限和角色', async () => {
    const actor = await createActorWithPermissions(
      [Permissions.USER_PERMISSION.READ_OWN, Permissions.ROLE.READ_ALL, Permissions.USER_ROLE.ASSIGN_ALL],
      { prefix: 'rbac-actor', assignedBy: 'self' },
    )
    const { response, body } = await integration.json<{
      permissions: Array<{ key: string }>
      roles: Array<{ id: string; name: string }>
    }>('/api/rbac/users/me/permissions', {}, actor)

    expect(response.status).toBe(200)
    expect(body.permissions).toContainEqual(
      expect.objectContaining({
        key: Permissions.USER_PERMISSION.READ_OWN,
      }),
    )
    expect(body.roles.some((role) => role.name.startsWith('rbac-actor-role'))).toBe(true)
  })

  it('GET /users/me/roles 返回当前用户角色及权限', async () => {
    const actor = await createActorWithPermissions([Permissions.USER_PERMISSION.READ_OWN], {
      prefix: 'rbac-actor',
      assignedBy: 'self',
    })
    const { response, body } = await integration.json<{
      roles: Array<{
        name: string
        source: string
        permissions: Array<{ key: string }>
      }>
    }>('/api/rbac/users/me/roles', {}, actor)

    expect(response.status).toBe(200)
    expect(body.roles.some((role) => role.name.startsWith('rbac-actor-role') && role.source === 'manual')).toBe(true)
    expect(
      body.roles.some((role) =>
        role.permissions.some((permission) => permission.key === Permissions.USER_PERMISSION.READ_OWN),
      ),
    ).toBe(true)
  })

  it('查询不存在用户时返回 404', async () => {
    const actor = await createActorWithPermissions(
      [Permissions.ROLE.READ_ALL, Permissions.USER_PERMISSION.READ_ALL, Permissions.USER_ROLE.REVOKE_ALL],
      { prefix: 'rbac-actor', assignedBy: 'self' },
    )
    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const responses = await Promise.all([
      actor('/api/rbac/users/missing-user/roles'),
      actor('/api/rbac/users/missing-user/permissions'),
      actor(`/api/rbac/users/missing-user/roles/${role.id}`, {
        method: 'DELETE',
      }),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 404,
        message: '用户不存在',
        errorCode: 'NOT_FOUND',
      })
    }
  })

  it('RBAC 非法参数返回 422', async () => {
    const actor = await createActorWithPermissions([Permissions.ROLE.READ_ALL, Permissions.USER_ROLE.ASSIGN_ALL], {
      prefix: 'rbac-actor',
      assignedBy: 'self',
    })

    const responses = await Promise.all([
      actor('/api/rbac/roles?page=abc'),
      actor('/api/rbac/roles?page=0'),
      actor(`/api/rbac/users/${actor.userId}/roles`, {
        body: JSON.stringify({ roleId: '' }),
        headers: integration.jsonHeaders(),
        method: 'POST',
      }),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    }
  })
})

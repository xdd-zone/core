/**
 * Nexus HTTP Client 集成测试
 *
 * 覆盖：
 * - 管理员 happy path
 * - 匿名访问 401
 * - 普通用户 own/me 成功
 * - 普通用户访问管理员接口 403
 *
 * 默认管理员账号：
 * xidongdong@gmail.com | xidongdong123..
 */

import {
  ForbiddenError,
  UnauthorizedError,
  createClient,
} from './src/index'
import { ApiError } from './src/error/api-error'

const BASE_URL = 'http://localhost:7788/api'

const ADMIN_USER = {
  email: 'xidongdong@gmail.com',
  password: 'xidongdong123..',
}

type TestContext = {
  passed: number
  failed: number
}

function logStep(title: string) {
  console.log(`\n${title}`)
}

function pass(context: TestContext, message: string) {
  context.passed += 1
  console.log(`   [OK] ${message}`)
}

function fail(context: TestContext, message: string, error?: unknown) {
  context.failed += 1
  console.log(`   [FAIL] ${message}`)
  if (error instanceof Error) {
    console.log(`   ${error.name}: ${error.message}`)
  } else if (error) {
    console.log(`   ${String(error)}`)
  }
}

async function expectSuccess<T>(
  context: TestContext,
  message: string,
  action: () => Promise<T>,
  validate?: (result: T) => void,
) {
  try {
    const result = await action()
    validate?.(result)
    pass(context, message)
    return result
  } catch (error) {
    fail(context, message, error)
    return null
  }
}

async function expectError(
  context: TestContext,
  message: string,
  errorType: abstract new (...args: any[]) => Error,
  action: () => Promise<unknown>,
) {
  try {
    await action()
    fail(context, `${message}（未抛出预期异常）`)
  } catch (error) {
    if (error instanceof errorType) {
      pass(context, message)
      return
    }

    fail(context, `${message}（异常类型不匹配）`, error)
  }
}

async function signIn(email: string, password: string) {
  const client = createClient({ baseURL: BASE_URL })
  await client.auth.signIn.post({ email, password })
  return client
}

async function runTests() {
  const context: TestContext = {
    passed: 0,
    failed: 0,
  }

  const tempSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const tempUser = {
    email: `integration-user-${tempSuffix}@example.com`,
    password: 'integration-pass-123',
    name: `Integration User ${tempSuffix}`,
  }

  let adminClient: ReturnType<typeof createClient> | null = null
  let tempClient: ReturnType<typeof createClient> | null = null
  let tempUserId: string | null = null
  let adminUserId: string | null = null

  console.log('=== Nexus HTTP Client 集成测试 ===')
  console.log(`管理员账号: ${ADMIN_USER.email}`)
  console.log(`临时账号: ${tempUser.email}`)

  try {
    logStep('0. 管理员登录与基础 happy path')
    adminClient = await expectSuccess(context, '管理员登录成功', () => signIn(ADMIN_USER.email, ADMIN_USER.password))

    if (!adminClient) {
      throw new Error('管理员登录失败，无法继续执行集成测试')
    }

    const adminMe = await expectSuccess(context, '管理员获取当前用户成功', () => adminClient!.auth.me.get(), (me) => {
      if (!me.user?.id) {
        throw new Error('管理员信息未返回 user.id')
      }
    })

    adminUserId = adminMe?.user?.id ?? null

    await expectSuccess(context, '管理员获取用户列表成功', () => adminClient!.user.list.get({ page: 1, pageSize: 10 }), (users) => {
      if (!Array.isArray(users.items)) {
        throw new Error('用户列表缺少 items')
      }
    })

    await expectSuccess(context, '管理员获取角色列表成功', () => adminClient!.rbac.roles.list.get({ page: 1, pageSize: 10 }))

    await expectSuccess(
      context,
      '管理员获取当前用户权限成功',
      () => adminClient!.rbac.users.me.permissions.get(),
      (result) => {
        if (!Array.isArray(result.permissions)) {
          throw new Error('当前用户权限结果缺少 permissions')
        }
      },
    )

    logStep('1. 匿名访问鉴权边界')
    const anonymousClient = createClient({ baseURL: BASE_URL })

    await expectError(context, '匿名访问 /auth/me 返回 401', UnauthorizedError, async () => {
      await anonymousClient.auth.me.get()
    })

    await expectError(context, '匿名访问 /user 返回 401', UnauthorizedError, async () => {
      await anonymousClient.user.list.get({ page: 1, pageSize: 10 })
    })

    await expectError(context, '匿名访问 /rbac/roles 返回 401', UnauthorizedError, async () => {
      await anonymousClient.rbac.roles.list.get({ page: 1, pageSize: 10 })
    })

    logStep('2. 注册临时普通用户')
    tempClient = createClient({ baseURL: BASE_URL })
    const signUpResult = await expectSuccess(context, '临时用户注册成功', () => tempClient!.auth.signUp.post(tempUser), (result) => {
      if (!result.user?.id) {
        throw new Error('注册结果未返回 user.id')
      }
    })

    tempUserId = signUpResult?.user?.id ?? null

    if (!tempClient || !tempUserId) {
      throw new Error('临时用户创建失败，无法继续执行普通用户权限测试')
    }

    logStep('3. 普通用户 own / me 成功路径')
    await expectSuccess(context, '普通用户获取 session 成功', () => tempClient!.auth.getSession.get(), (session) => {
      if (!session.isAuthenticated) {
        throw new Error('普通用户 session 未认证')
      }
    })

    await expectSuccess(context, '普通用户获取 /auth/me 成功', () => tempClient!.auth.me.get(), (me) => {
      if (me.user?.id !== tempUserId) {
        throw new Error('普通用户 /auth/me 返回的 user.id 不匹配')
      }
    })

    await expectSuccess(context, '普通用户获取自己的用户详情成功', () => tempClient!.user.get(tempUserId!), (user) => {
      if (user.id !== tempUserId) {
        throw new Error('普通用户 user.get(self) 返回的 id 不匹配')
      }
    })

    await expectSuccess(context, '普通用户获取自己的角色成功', () => tempClient!.rbac.users.me.roles.get(), (result) => {
      if (!Array.isArray(result.roles)) {
        throw new Error('当前用户角色结果缺少 roles')
      }
    })

    await expectSuccess(
      context,
      '普通用户获取自己的权限成功',
      () => tempClient!.rbac.users.me.permissions.get(),
      (result) => {
        if (!Array.isArray(result.permissions)) {
          throw new Error('当前用户权限结果缺少 permissions')
        }
      },
    )

    await expectSuccess(context, '普通用户获取自己的角色列表成功', () => tempClient!.rbac.users.get(tempUserId!), (result) => {
      if (!Array.isArray(result)) {
        throw new Error('用户角色列表返回值不是数组')
      }
    })

    await expectSuccess(
      context,
      '普通用户获取自己的权限列表成功',
      () => tempClient!.rbac.getUserPermissions(tempUserId!),
      (result) => {
        if (!Array.isArray(result.permissions)) {
          throw new Error('用户权限列表返回值缺少 permissions')
        }
      },
    )

    logStep('4. 普通用户权限拒绝路径')
    await expectError(context, '普通用户访问 /user 列表返回 403', ForbiddenError, async () => {
      await tempClient!.user.list.get({ page: 1, pageSize: 10 })
    })

    await expectError(context, '普通用户访问 /rbac/roles 返回 403', ForbiddenError, async () => {
      await tempClient!.rbac.roles.list.get({ page: 1, pageSize: 10 })
    })

    await expectError(context, '普通用户访问 /rbac/permissions 返回 403', ForbiddenError, async () => {
      await tempClient!.rbac.permissions.list.get({ page: 1, pageSize: 10 })
    })

    if (adminUserId) {
      await expectError(context, '普通用户访问其他用户详情返回 403', ForbiddenError, async () => {
        await tempClient!.user.get(adminUserId!)
      })

      await expectError(context, '普通用户访问其他用户角色返回 403', ForbiddenError, async () => {
        await tempClient!.rbac.users.get(adminUserId!)
      })

      await expectError(context, '普通用户访问其他用户权限返回 403', ForbiddenError, async () => {
        await tempClient!.rbac.getUserPermissions(adminUserId!)
      })
    }
  } finally {
    logStep('5. 清理临时用户')

    if (!adminClient) {
      try {
        adminClient = await signIn(ADMIN_USER.email, ADMIN_USER.password)
      } catch (error) {
        fail(context, '清理阶段管理员重新登录失败', error)
      }
    }

    if (adminClient && tempUserId) {
      try {
        await adminClient.user.delete(tempUserId)
        pass(context, `临时用户已删除: ${tempUserId}`)
      } catch (error) {
        fail(context, `临时用户删除失败: ${tempUserId}`, error)
      }
    } else {
      console.log('   [SKIP] 无临时用户需要清理')
    }

    if (adminClient) {
      try {
        await adminClient.auth.signOut.post()
        pass(context, '管理员登出成功')
      } catch (error) {
        fail(context, '管理员登出失败', error)
      }
    }

    if (tempClient) {
      try {
        await tempClient.auth.signOut.post()
        pass(context, '临时用户登出成功')
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          console.log('   [SKIP] 临时用户会话已失效，无需登出')
        } else {
          fail(context, '临时用户登出失败', error)
        }
      }
    }
  }

  console.log('\n=== 测试结果 ===')
  console.log(`通过: ${context.passed}`)
  console.log(`失败: ${context.failed}`)

  if (context.failed > 0) {
    process.exitCode = 1
    console.log('集成测试存在失败项')
    return
  }

  console.log('集成测试全部通过')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

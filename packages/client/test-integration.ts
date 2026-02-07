/**
 * Nexus HTTP Client 集成测试
 *
 * 测试用户: xidongdong@gmail.com | xidongdong123..
 */

import { createClient } from './src/index'

const BASE_URL = 'http://localhost:7788/api'

// 测试用户凭证
const TEST_USER = {
  email: 'xidongdong@gmail.com',
  password: 'xidongdong123..',
}

async function runTests() {
  console.log('=== Nexus HTTP Client 集成测试 ===\n')
  console.log(`测试用户: ${TEST_USER.email}\n`)

  const client = createClient({ baseURL: BASE_URL })

  // ========== 第一步：登录 ==========
  console.log('0. 用户登录...')
  try {
    const loginResult = await client.auth.signIn.post({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })

    if (loginResult.data.code === 0) {
      console.log('   [OK] 登录成功')
    } else {
      console.log(`   [FAIL] 登录失败: ${loginResult.data.message}`)
      console.log('   请检查用户是否存在或密码是否正确')
      return
    }
  } catch (error) {
    console.log(`   [FAIL] 登录异常: ${error}`)
    return
  }

  // ========== 第二步：测试已登录的 API ==========
  console.log('\n1. 获取当前用户信息...')
  try {
    const me = await client.auth.me.get()
    if (me.data.code === 0) {
      console.log(`   [OK] 用户: ${me.data.data?.user?.name || me.data.data?.user?.email}`)
    } else {
      console.log(`   [FAIL] ${me.data.message}`)
    }
  } catch (error) {
    console.log(`   [FAIL] ${error}`)
  }

  console.log('\n2. 获取用户列表...')
  try {
    const users = await client.user.list.get({ page: 1, pageSize: 10 })
    if (users.data.code === 0) {
      const count = users.data.data?.list?.length || 0
      const total = users.data.data?.pagination?.total || 0
      console.log(`   [OK] 用户列表: ${count} 条 (共 ${total} 条)`)
    } else {
      console.log(`   [FAIL] ${users.data.message}`)
    }
  } catch (error) {
    console.log(`   [FAIL] ${error}`)
  }

  console.log('\n3. 测试 RBAC 角色列表...')
  try {
    const roles = await client.rbac.roles.list.get({ page: 1 })
    if (roles.data.code === 0) {
      const count = roles.data.data?.items?.length || 0
      console.log(`   [OK] 角色列表: ${count} 条`)
    } else {
      console.log(`   [FAIL] ${roles.data.message}`)
    }
  } catch (error) {
    console.log(`   [FAIL] ${error}`)
  }

  console.log('\n4. 测试 RBAC 权限列表...')
  try {
    const permissions = await client.rbac.permissions.list.get({ page: 1 })
    if (permissions.data.code === 0) {
      const count = permissions.data.data?.items?.length || 0
      console.log(`   [OK] 权限列表: ${count} 条`)
    } else {
      console.log(`   [FAIL] ${permissions.data.message}`)
    }
  } catch (error) {
    console.log(`   [FAIL] ${error}`)
  }

  console.log('\n5. 测试获取当前用户权限...')
  try {
    const myPermissions = await client.rbac.users.me.permissions.get()
    if (myPermissions.data.code === 0) {
      const permissions = myPermissions.data.data?.permissions || []
      const roles = myPermissions.data.data?.roles || []
      console.log(`   [OK] 用户权限: ${permissions.length} 个`)
      console.log(`   [OK] 用户角色: ${roles.length} 个`)
    } else {
      console.log(`   [FAIL] ${myPermissions.data.message}`)
    }
  } catch (error) {
    console.log(`   [FAIL] ${error}`)
  }

  // ========== 第三步：登出 ==========
  console.log('\n6. 用户登出...')
  try {
    await client.auth.signOut.post()
    console.log('   [OK] 登出成功')
  } catch (error) {
    console.log(`   [FAIL] ${error}`)
  }

  console.log('\n=== 测试完成 ===')
}

runTests().catch(console.error)

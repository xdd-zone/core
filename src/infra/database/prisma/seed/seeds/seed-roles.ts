import type pino from 'pino'
import type { PrismaClient } from '../../generated'

/**
 * 角色种子数据
 *
 * 角色层级说明：
 * - level: 角色等级，数值越高权限越大（100 > 90 > 50）
 * - isSystem: 是否为系统角色，系统角色不允许删除
 * - parentId: 父角色ID，用于建立角色继承关系
 *
 * 角色层级：
 * 1. superAdmin (level: 100) - 超级管理员，拥有所有权限
 * 2. admin (level: 90) - 管理员，继承自 superAdmin，拥有用户管理权限
 * 3. user (level: 50) - 普通用户，只有基本权限
 */
export async function seedRoles(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始创建角色...')

  const roles = [
    {
      name: 'superAdmin',
      displayName: '超级管理员',
      description: '拥有系统所有权限',
      level: 100,
      isSystem: true,
    },
    {
      name: 'admin',
      displayName: '管理员',
      description: '拥有用户管理权限',
      parentId: null, // 将在创建后设置为 superAdmin 的 ID
      level: 90,
      isSystem: true,
    },
    {
      name: 'user',
      displayName: '普通用户',
      description: '普通用户，只有基本权限',
      level: 50,
      isSystem: true,
    },
  ]

  // 批量创建/更新角色
  // 使用 upsert 确保重复运行不会创建重复数据
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {}, // 如果存在则不更新
      create: role, // 如果不存在则创建
    })
  }

  // 设置 admin 的父角色为 superAdmin
  // 这样可以建立角色继承关系
  const superAdmin = await prisma.role.findUnique({ where: { name: 'superAdmin' } })
  const admin = await prisma.role.findUnique({ where: { name: 'admin' } })

  if (superAdmin && admin) {
    await prisma.role.update({
      where: { name: 'admin' },
      data: { parentId: superAdmin.id },
    })
  }

  logger.info('✅ 角色创建完成')
}

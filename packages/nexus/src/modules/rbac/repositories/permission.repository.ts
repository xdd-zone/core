import { prisma } from '@/infra/database/client'

/**
 * 权限数据访问层
 *
 * 职责：
 * - 提供权限数据的 CRUD 操作
 * - 支持按资源分组查询权限
 * - 处理权限的唯一性和一致性
 *
 * @class PermissionRepository
 */
export class PermissionRepository {
  /**
   * 查询权限列表（分页）
   *
   * @param where - Prisma 查询条件
   * @param skip - 跳过记录数
   * @param take - 获取记录数
   * @returns 包含权限列表和总数的对象
   *
   * @example
   * ```ts
   * const { permissions, total } = await PermissionRepository.findMany(
   *   { resource: 'user' },
   *   0,
   *   20
   * )
   * ```
   */
  static async findMany(where: any, skip: number, take: number) {
    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      prisma.permission.count({ where }),
    ])

    return { permissions, total }
  }

  /**
   * 根据 ID 查询权限
   *
   * @param id - 权限 ID
   * @returns 权限对象
   * @returns null 如果权限不存在
   *
   * @example
   * ```ts
   * const permission = await PermissionRepository.findById('perm_123')
   * ```
   */
  static async findById(id: string) {
    return await prisma.permission.findUnique({
      where: { id },
    })
  }

  /**
   * 根据资源类型查询权限
   *
   * @param resource - 资源类型（如 'user', 'article'）
   * @returns 该资源的所有权限列表（按 action 升序）
   *
   * @example
   * ```ts
   * const userPerms = await PermissionRepository.findByResource('user')
   * // 返回: [{ id, resource: 'user', action: 'create', ... }, ...]
   * ```
   */
  static async findByResource(resource: string) {
    return await prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    })
  }

  /**
   * 创建权限
   *
   * @param data - 权限数据
   * @param data.resource - 资源类型
   * @param data.action - 操作类型
   * @param data.scope - 权限范围（可选：'own', 'all', 'department', 'category'）
   * @param data.displayName - 权限显示名称
   * @param data.description - 权限描述
   * @returns 创建的权限对象
   *
   * @example
   * ```ts
   * const permission = await PermissionRepository.create({
   *   resource: 'article',
   *   action: 'publish',
   *   scope: 'own',
   *   displayName: '发布自己的文章'
   * })
   * ```
   */
  static async create(data: any) {
    return await prisma.permission.create({
      data,
    })
  }

  /**
   * 更新权限
   *
   * @param id - 权限 ID
   * @param data - 更新数据
   * @returns 更新后的权限对象
   *
   * @example
   * ```ts
   * const updated = await PermissionRepository.update('perm_id', {
   *   displayName: '新显示名称',
   *   description: '更新后的描述'
   * })
   * ```
   */
  static async update(id: string, data: any) {
    return await prisma.permission.update({
      where: { id },
      data,
    })
  }

  /**
   * 删除权限
   *
   * 警告：
   * - 级联删除：会同时删除角色权限关联
   *
   * @param id - 权限 ID
   * @returns 被删除的权限对象
   *
   * @example
   * ```ts
   * const deleted = await PermissionRepository.delete('perm_id')
   * ```
   */
  static async delete(id: string) {
    return await prisma.permission.delete({
      where: { id },
    })
  }

  /**
   * 查询所有权限并按资源分组
   *
   * 说明：
   * - 返回格式：[{ resource: 'user', permissions: [...] }, ...]
   * - 按资源名称和操作名排序
   * - 适用于前端权限树展示
   *
   * @returns 按资源分组的权限列表
   *
   * @example
   * ```ts
   * const grouped = await PermissionRepository.findAllGroupedBy()
   * // 返回:
   * // [
   * //   {
   * //     resource: 'user',
   * //     permissions: [
   * //       { id: '1', action: 'create', scope: null, displayName: '创建用户' },
   * //       { id: '2', action: 'read', scope: null, displayName: '查看用户' }
   * //     ]
   * //   },
   * //   { resource: 'article', permissions: [...] }
   * // ]
   * ```
   */
  static async findAllGroupedBy() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })

    // Group by resource
    const grouped = permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = []
        }
        acc[perm.resource].push(perm)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Convert to array format
    return Object.entries(grouped).map(([resource, permissions]) => ({
      resource,
      permissions: permissions.map((p) => ({
        id: p.id,
        action: p.action,
        scope: p.scope,
        displayName: p.displayName,
      })),
    }))
  }
}

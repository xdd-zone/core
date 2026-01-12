import { prisma } from '@/infra/database/client'

/**
 * 角色数据访问层
 *
 * 职责：
 * - 提供角色数据的 CRUD 操作
 * - 处理角色层级关系（父子角色）
 * - 支持角色权限关联查询
 *
 * @class RoleRepository
 */
export class RoleRepository {
  /**
   * 查询角色列表（分页）
   *
   * @param where - Prisma 查询条件
   * @param skip - 跳过记录数
   * @param take - 获取记录数
   * @returns 包含角色列表和总数的对象
   *
   * @example
   * ```ts
   * const { roles, total } = await RoleRepository.findMany(
   *   { name: { contains: 'admin' } },
   *   0,
   *   20
   * )
   * ```
   */
  static async findMany(where: any, skip: number, take: number) {
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: {
            select: { id: true, name: true, displayName: true },
          },
        },
      }),
      prisma.role.count({ where }),
    ])

    return { roles, total }
  }

  /**
   * 根据 ID 查询角色详情
   *
   * @param id - 角色 ID
   * @returns 角色对象（包含父角色和权限关联）
   * @returns null 如果角色不存在
   *
   * @example
   * ```ts
   * const role = await RoleRepository.findById('role_123')
   * ```
   */
  static async findById(id: string) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        parent: true,
        permissions: {
          include: { permission: true },
        },
      },
    })
  }

  /**
   * 根据名称查询角色
   *
   * @param name - 角色名称（唯一标识）
   * @returns 角色对象
   * @returns null 如果角色不存在
   *
   * @example
   * ```ts
   * const admin = await RoleRepository.findByName('admin')
   * ```
   */
  static async findByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
    })
  }

  /**
   * 查询指定父角色的所有子角色
   *
   * @param parentId - 父角色 ID
   * @returns 子角色列表（按创建时间倒序）
   *
   * @example
   * ```ts
   * const children = await RoleRepository.findChildren('parent_role_id')
   * ```
   */
  static async findChildren(parentId: string) {
    return await prisma.role.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 创建新角色
   *
   * 说明：
   * - 自动计算角色层级（level）
   * - 如果有父角色，level = parent.level + 1
   * - 如果无父角色，level = 0
   *
   * @param data - 角色数据
   * @param data.name - 角色名称（唯一）
   * @param data.displayName - 角色显示名称
   * @param data.description - 角色描述
   * @param data.parentId - 父角色 ID（可选）
   * @returns 创建的角色对象
   *
   * @example
   * ```ts
   * const role = await RoleRepository.create({
   *   name: 'editor',
   *   displayName: '编辑',
   *   description: '内容编辑权限',
   *   parentId: 'admin_role_id'
   * })
   * ```
   */
  static async create(data: any) {
    // Calculate level based on parent
    let level = 0
    if (data.parentId) {
      const parent = await prisma.role.findUnique({
        where: { id: data.parentId },
      })
      if (parent) {
        level = parent.level + 1
      }
    }

    return await prisma.role.create({
      data: {
        ...data,
        level,
      },
    })
  }

  /**
   * 更新角色信息
   *
   * 说明：
   * - 如果修改了父角色，自动重新计算 level
   * - 支持部分字段更新
   *
   * @param id - 角色 ID
   * @param data - 更新数据
   * @param data.displayName - 显示名称（可选）
   * @param data.description - 描述（可选）
   * @param data.parentId - 父角色 ID（可选，设置为 null 可取消父角色）
   * @returns 更新后的角色对象
   *
   * @example
   * ```ts
   * const updated = await RoleRepository.update('role_id', {
   *   displayName: '超级管理员',
   *   parentId: null
   * })
   * ```
   */
  static async update(id: string, data: any) {
    // Recalculate level if parent changed
    if (data.parentId !== undefined) {
      let level = 0
      if (data.parentId) {
        const parent = await prisma.role.findUnique({
          where: { id: data.parentId },
        })
        if (parent) {
          level = parent.level + 1
        }
      }
      data.level = level
    }

    return await prisma.role.update({
      where: { id },
      data,
    })
  }

  /**
   * 删除角色
   *
   * 警告：
   * - 级联删除：会同时删除角色权限关联和用户角色关联
   * - 建议在 Service 层检查系统角色保护
   *
   * @param id - 角色 ID
   * @returns 被删除的角色对象
   *
   * @example
   * ```ts
   * const deleted = await RoleRepository.delete('role_id')
   * ```
   */
  static async delete(id: string) {
    return await prisma.role.delete({
      where: { id },
    })
  }

  /**
   * 查询角色及其权限关联
   *
   * @param id - 角色 ID
   * @returns 角色对象（包含权限关联）
   * @returns null 如果角色不存在
   *
   * @example
   * ```ts
   * const roleWithPerms = await RoleRepository.findWithPermissions('role_id')
   * console.log(roleWithPerms.permissions)
   * ```
   */
  static async findWithPermissions(id: string) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }
}

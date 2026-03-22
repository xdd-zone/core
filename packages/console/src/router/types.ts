import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * 菜单项类型（从 Antd MenuProps 导出，供其他模块统一使用）
 */
export type MenuItem = Required<MenuProps>['items'][number]

/**
 * 路由类型枚举
 */
export enum RouteType {
  /** 全局路由 - 不在菜单中显示，如登录、注册、404等 */
  GLOBAL = 'global',
  /** 菜单路由 - 在侧边栏菜单中显示 */
  MENU = 'menu',
  /** 隐藏路由 - 可访问但不在菜单中显示，如详情页 */
  HIDDEN = 'hidden',
}

/**
 * 路由扩展属性
 */
export interface RouteHandle {
  /**
   * 路由权限 - 用于标识路由所需的权限
   */
  auth?: string

  /**
   * 面包屑标题 - 如果不设置则使用title
   */
  breadcrumbTitle?: string

  /**
   * 是否隐藏子菜单 - 当只有一个子路由时是否隐藏父级菜单
   */
  hideChildrenInMenu?: boolean

  /**
   * 路由图标 - 仅对菜单路由有效，使用 lucide-react 图标组件
   */
  icon?: ComponentType<LucideProps>

  /**
   * 菜单排序 - 数字越小越靠前
   */
  order?: number

  /**
   * 菜单标题 - 仅对菜单路由有效，如果不设置则使用路由path作为标题
   */
  title?: string

  /**
   * 路由类型 - 用于区分全局路由、菜单路由和隐藏路由
   * @default RouteType.MENU
   */
  type?: RouteType
}

import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

import type { RouteHandle } from '@/router/types'

import React from 'react'

/**
 * 构建完整路由路径
 * @param routePath 路由路径
 * @param parentPath 父级路径
 * @returns 完整路径
 */
export function buildRoutePath(routePath: string, parentPath = ''): string {
  if (!routePath && !parentPath) {
    return ''
  }

  if (!routePath) {
    return parentPath
  }

  if (routePath.startsWith('/')) {
    return routePath
  }

  if (!parentPath) {
    return routePath
  }

  return `${parentPath}/${routePath}`.replace(/\/+/g, '/')
}

/**
 * 渲染图标组件
 * @param IconComponent 图标组件
 * @returns JSX 元素或 null
 */
export function renderIcon(IconComponent?: ComponentType<LucideProps>): React.ReactNode {
  if (!IconComponent) return null
  return React.createElement(IconComponent, { size: 16 })
}

/**
 * 菜单项扩展类型（含排序信息）
 */
export interface MenuItemWithOrder {
  children?: MenuItemWithOrder[]
  icon?: React.ReactNode
  key: React.Key
  label: React.ReactNode
  order?: number
}

/**
 * 菜单项类型（从 Antd MenuProps 导出）
 */
export type MenuItem = Required<MenuProps>['items'][number]

/**
 * 从路由配置中查找路由信息
 * @param routes 路由配置数组
 * @param targetPath 目标路径
 * @param parentPath 父路径
 * @returns 匹配的路由对象或null
 */
export function findRouteByPath(
  routes: RouteObject[],
  targetPath: string,
  parentPath = '',
): (RouteObject & { handle?: RouteHandle }) | null {
  for (const route of routes) {
    const routePath = route.path || ''

    // 构建完整路径
    const fullPath = buildRoutePath(routePath, parentPath)

    // 检查是否匹配目标路径
    if (fullPath === targetPath) {
      return route as RouteObject & { handle?: RouteHandle }
    }

    // 递归查找子路由
    if (route.children && route.children.length > 0) {
      const childResult = findRouteByPath(route.children, targetPath, fullPath)
      if (childResult) {
        return childResult
      }
    }
  }

  return null
}

/**
 * 检查路由是否有实际的组件（不仅仅是重定向）
 * @param route 路由对象
 * @returns 是否有实际组件
 */
export function hasActualComponent(route: RouteObject): boolean {
  // 如果有 Component 或 lazy 属性，说明有实际组件
  if (route.Component || route.lazy) {
    return true
  }

  // 如果有 element 且不是 Navigate 重定向，说明有实际组件
  if (route.element) {
    // 检查是否是 Navigate 组件（重定向）
    const elementType = (route.element as React.ReactElement)?.type
    if (typeof elementType === 'function' && elementType.name === 'Navigate') {
      return false
    }
    return true
  }

  // 如果只有 index: true，通常是重定向路由
  if (route.index === true) {
    return false
  }

  return false
}

/**
 * 生成标签页ID
 * 基于路径生成唯一标识符
 */
export function generateTabId(path: string): string {
  return path.replace(/\//g, '-').replace(/^-/, '') || 'home'
}

/**
 * 根据当前路径查找匹配的菜单项key
 * 使用路径前缀匹配策略
 */
export function findMatchingMenuKey(items: MenuItem[], currentPath: string): string | null {
  // 按路径长度降序排序，优先匹配更具体的路径
  const sortedItems = [...items].sort((a, b) => {
    const keyA = String(a?.key ?? '')
    const keyB = String(b?.key ?? '')
    return keyB.length - keyA.length
  })

  for (const item of sortedItems) {
    if (!item) continue

    const itemKey = String(item.key)

    // 精确匹配
    if (itemKey === currentPath) {
      return itemKey
    }

    // 前缀匹配（排除根路径）
    if (itemKey !== '/' && currentPath.startsWith(itemKey)) {
      // 检查是否有更具体的子菜单匹配
      if ('children' in item && item.children) {
        const childMatch = findMatchingMenuKey(item.children, currentPath)
        if (childMatch) {
          return childMatch
        }
      }
      return itemKey
    }
  }

  return null
}

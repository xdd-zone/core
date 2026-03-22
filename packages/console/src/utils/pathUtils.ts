import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

import React from 'react'

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

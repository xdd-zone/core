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

interface MatchedMenuResult {
  openKeys: string[]
  selectedKey: string | null
}

/**
 * 生成标签页ID
 * 基于路径生成唯一标识符
 */
export function generateTabId(path: string): string {
  return path.replace(/\//g, '-').replace(/^-/, '') || 'home'
}

function isPathMenuKey(key: string): boolean {
  return key.startsWith('/')
}

function isPathKeyMatched(key: string, currentPath: string): boolean {
  if (!isPathMenuKey(key)) {
    return false
  }

  if (key === currentPath) {
    return true
  }

  if (key === '/') {
    return currentPath === '/'
  }

  return currentPath.startsWith(`${key}/`)
}

function findMatchedMenuResult(items: MenuItem[], currentPath: string, ancestorKeys: string[] = []): MatchedMenuResult {
  let matchedResult: MatchedMenuResult = {
    openKeys: [],
    selectedKey: null,
  }

  for (const item of items) {
    if (!item) continue

    const itemKey = String(item.key ?? '')
    const nextAncestorKeys = itemKey ? [...ancestorKeys, itemKey] : ancestorKeys

    if ('children' in item && item.children?.length) {
      const childMatchedResult = findMatchedMenuResult(item.children, currentPath, nextAncestorKeys)
      const childMatchedKeyLength = childMatchedResult.selectedKey?.length ?? 0
      const currentMatchedKeyLength = matchedResult.selectedKey?.length ?? 0

      if (childMatchedResult.selectedKey && childMatchedKeyLength > currentMatchedKeyLength) {
        matchedResult = childMatchedResult
      }
    }

    if (!isPathKeyMatched(itemKey, currentPath)) {
      continue
    }

    const currentMatchedKeyLength = matchedResult.selectedKey?.length ?? 0

    if (itemKey.length > currentMatchedKeyLength) {
      matchedResult = {
        openKeys: ancestorKeys,
        selectedKey: itemKey,
      }
    }
  }

  return matchedResult
}

/**
 * 根据当前路径查找匹配的菜单项key
 * 使用路径边界匹配策略，支持递归查找子菜单项
 */
export function findMatchingMenuKey(items: MenuItem[], currentPath: string): string | null {
  return findMatchedMenuResult(items, currentPath).selectedKey
}

/**
 * 根据当前路径查找菜单选中项和需要展开的父级菜单
 */
export function findMatchingMenuState(
  items: MenuItem[],
  currentPath: string,
): { openKeys: string[]; selectedKeys: string[] } {
  const matchedResult = findMatchedMenuResult(items, currentPath)

  return {
    openKeys: matchedResult.selectedKey ? matchedResult.openKeys : [],
    selectedKeys: matchedResult.selectedKey ? [matchedResult.selectedKey] : [],
  }
}

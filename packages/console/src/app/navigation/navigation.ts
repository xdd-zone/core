import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

import { Crop, FileText, FolderOpen, LayoutDashboard } from 'lucide-react'

import { renderIcon } from '@/utils/pathUtils'

type MenuItem = Required<MenuProps>['items'][number]

export interface NavigationItem {
  children?: NavigationItem[]
  icon?: ComponentType<LucideProps>
  key: string
  label: string
  path?: string
}

/**
 * 后台导航配置。
 */
export const navigationItems: NavigationItem[] = [
  {
    icon: LayoutDashboard,
    key: 'dashboard',
    label: 'menu.dashboard',
    path: '/dashboard',
  },
  {
    icon: FileText,
    key: 'content',
    label: 'menu.articleManagement',
    children: [
      {
        key: 'articles',
        label: 'menu.articleList',
        path: '/articles',
      },
      {
        key: 'categories',
        label: 'menu.categoryManagement',
        path: '/categories',
      },
      {
        key: 'tags',
        label: 'menu.tagManagement',
        path: '/tags',
      },
      {
        key: 'comments',
        label: 'menu.commentManagement',
        path: '/comments',
      },
      {
        key: 'article-settings',
        label: 'menu.articleSettings',
        path: '/article-settings',
      },
    ],
  },
  {
    icon: FolderOpen,
    key: 'examples',
    label: 'menu.exampleFeatures',
    children: [
      {
        icon: Crop,
        key: 'image-crop',
        label: 'menu.imageCrop',
        path: '/image-crop',
      },
    ],
  },
]

function toMenuItem(item: NavigationItem, t?: (key: string) => string): MenuItem {
  return {
    children: item.children?.map((child) => toMenuItem(child, t)),
    icon: renderIcon(item.icon),
    key: item.path ?? item.key,
    label: t ? t(item.label) : item.label,
  }
}

/**
 * 构建 Antd 导航菜单数据。
 */
export function buildNavigationMenuItems(t?: (key: string) => string): MenuItem[] {
  return navigationItems.map((item) => toMenuItem(item, t))
}

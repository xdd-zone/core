import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

import { canAccessConsolePath } from '@console/app/access/access-control'
import { renderIcon } from '@console/utils/pathUtils'

import {
  AlertTriangle,
  Crop,
  FileText,
  FileText as FileTextIcon,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  MessageSquare,
  Newspaper,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SquarePen,
  Tags,
  User,
  Users,
} from 'lucide-react'

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
    icon: Users,
    key: 'system',
    label: 'menu.systemManagement',
    children: [
      {
        icon: User,
        key: 'users',
        label: 'menu.userManagement',
        path: '/users',
      },
      {
        icon: Shield,
        key: 'roles',
        label: 'menu.roleManagement',
        path: '/roles',
      },
      {
        icon: ShieldCheck,
        key: 'my-access',
        label: 'menu.myAccess',
        path: '/my-access',
      },
      {
        icon: KeyRound,
        key: 'my-profile',
        label: 'menu.myProfile',
        path: '/profile',
      },
    ],
  },
  {
    icon: FileText,
    key: 'content',
    label: 'menu.articleManagement',
    children: [
      {
        icon: Newspaper,
        key: 'articles',
        label: 'menu.articleList',
        path: '/articles',
      },
      {
        icon: FolderOpen,
        key: 'categories',
        label: 'menu.categoryManagement',
        path: '/categories',
      },
      {
        icon: Tags,
        key: 'tags',
        label: 'menu.tagManagement',
        path: '/tags',
      },
      {
        icon: MessageSquare,
        key: 'comments',
        label: 'menu.commentManagement',
        path: '/comments',
      },
      {
        icon: Settings,
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
        icon: LayoutTemplate,
        key: 'ui-showcase',
        label: 'menu.uiShowcase',
        path: '/ui-showcase',
      },
      {
        icon: FileTextIcon,
        key: 'markdown-example',
        label: 'menu.markdownExample',
        path: '/markdown-example',
      },
      {
        icon: SquarePen,
        key: 'tiptap-example',
        label: 'menu.tiptapExample',
        path: '/tiptap-example',
      },
      {
        icon: Crop,
        key: 'image-crop',
        label: 'menu.imageCrop',
        path: '/image-crop',
      },
      {
        icon: AlertTriangle,
        key: 'error-example',
        label: 'menu.errorExample',
        path: '/error-example',
      },
      {
        icon: Lock,
        key: 'forbidden-example',
        label: 'menu.forbiddenExample',
        path: '/forbidden-example',
      },
      {
        icon: Search,
        key: 'not-found-example',
        label: 'menu.notFoundExample',
        path: '/not-found-example',
      },
    ],
  },
]

function filterNavigationItems(items: NavigationItem[], permissionKeys: Iterable<string>): NavigationItem[] {
  return items.reduce<NavigationItem[]>((visibleItems, item) => {
    const visibleChildren = item.children ? filterNavigationItems(item.children, permissionKeys) : undefined
    const canAccessCurrentItem = item.path ? canAccessConsolePath(item.path, permissionKeys) : true

    if (visibleChildren && visibleChildren.length > 0) {
      visibleItems.push({
        ...item,
        children: visibleChildren,
      })
      return visibleItems
    }

    if (item.children) {
      return visibleItems
    }

    if (canAccessCurrentItem) {
      visibleItems.push(item)
    }

    return visibleItems
  }, [])
}

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
export function buildNavigationMenuItems(t?: (key: string) => string, permissionKeys?: Iterable<string>): MenuItem[] {
  const visibleNavigationItems = permissionKeys
    ? filterNavigationItems(navigationItems, permissionKeys)
    : navigationItems

  return visibleNavigationItems.map((item) => toMenuItem(item, t))
}

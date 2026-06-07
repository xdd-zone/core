import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

import { renderIcon } from '@console/utils/pathUtils'
import {
  AlertTriangle,
  Crop,
  FileTextIcon,
  FolderOpen,
  House,
  LayoutTemplate,
  Lock,
  Search,
  SquarePen,
} from 'lucide-react'

type MenuItem = Required<MenuProps>['items'][number]

export interface NavigationItem {
  children?: NavigationItem[]
  icon?: ComponentType<LucideProps>
  key: string
  label: string
  path?: string
}

export const navigationItems: NavigationItem[] = [
  {
    icon: House,
    key: 'home',
    label: 'menu.home',
    path: '/',
  },
  {
    icon: FolderOpen,
    key: 'examples',
    label: 'menu.examples',
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

function toMenuItem(item: NavigationItem, t?: (key: string) => string): MenuItem {
  return {
    children: item.children?.map((child) => toMenuItem(child, t)),
    icon: renderIcon(item.icon),
    key: item.path ?? item.key,
    label: t ? t(item.label) : item.label,
  }
}

export function buildNavigationMenuItems(t?: (key: string) => string): MenuItem[] {
  return navigationItems.map((item) => toMenuItem(item, t))
}

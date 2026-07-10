import type { FifaRouteRecord } from '@fifa/app/router/types'
import type { MenuProps } from 'antd'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { fifaRouteRecords } from '@fifa/app/router/records'
import { renderIcon } from '@fifa/utils/pathUtils'
import { Activity, FileText, FolderOpen, Globe2, Settings } from 'lucide-react'

type MenuItem = Required<MenuProps>['items'][number]

export interface NavigationItem {
  children?: NavigationItem[]
  icon?: ComponentType<LucideProps>
  key: string
  label: string
  path?: string
}

interface NavigationGroup {
  icon?: ComponentType<LucideProps>
  label: string
  order?: number
}

export const navigationGroups: Record<string, NavigationGroup> = {
  content: {
    icon: FileText,
    label: 'menu.content',
    order: 10,
  },
  examples: {
    icon: FolderOpen,
    label: 'menu.examples',
    order: 30,
  },
  site: {
    icon: Globe2,
    label: 'menu.site',
    order: 15,
  },
  settings: {
    icon: Settings,
    label: 'menu.settings',
    order: 20,
  },
  system: {
    icon: Activity,
    label: 'menu.system',
    order: 25,
  },
}

function getRecordOrder(record: FifaRouteRecord, fallbackOrder: number): number {
  if (record.menu && typeof record.menu === 'object' && typeof record.menu.order === 'number') {
    return record.menu.order
  }

  return fallbackOrder
}

function toNavigationItem(record: FifaRouteRecord): NavigationItem {
  return {
    icon: record.icon,
    key: record.id,
    label: record.title,
    path: record.path,
  }
}

function buildNavigationItems(records: FifaRouteRecord[]): NavigationItem[] {
  const groupedItems = new Map<string, Array<{ item: NavigationItem; order: number }>>()
  const rootItems: Array<{ item: NavigationItem; order: number }> = []

  records.forEach((record, index) => {
    if (record.menu === false) {
      return
    }

    const item = toNavigationItem(record)
    const order = getRecordOrder(record, index)
    const groupKey = record.menu && typeof record.menu === 'object' ? record.menu.group : undefined

    if (!groupKey) {
      rootItems.push({ item, order })
      return
    }

    const items = groupedItems.get(groupKey) ?? []
    items.push({ item, order })
    groupedItems.set(groupKey, items)
  })

  const groupItems = Array.from(groupedItems.entries()).map(([groupKey, items]) => {
    const group = navigationGroups[groupKey]

    return {
      item: {
        children: items.sort((a, b) => a.order - b.order).map(({ item }) => item),
        icon: group?.icon,
        key: groupKey,
        label: group?.label ?? groupKey,
      },
      order: group?.order ?? Number.MAX_SAFE_INTEGER,
    }
  })

  return [...rootItems, ...groupItems].sort((a, b) => a.order - b.order).map(({ item }) => item)
}

export const navigationItems: NavigationItem[] = buildNavigationItems(fifaRouteRecords)

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

import type { RouteComponent } from '@tanstack/react-router'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

export type ConsoleRouteComponent = RouteComponent

export interface ConsoleLayoutMeta {
  contentWidth?: 'default' | 'full'
}

export interface ConsoleMenuMeta {
  group?: string
  order?: number
}

export interface ConsoleTabMeta {
  closable?: boolean
}

export interface ConsoleRouteRecord {
  component: ConsoleRouteComponent
  icon?: ComponentType<LucideProps>
  id: string
  layout?: ConsoleLayoutMeta
  menu?: false | ConsoleMenuMeta
  path: string
  tab?: false | ConsoleTabMeta
  title: string
}

export interface AppRouteMeta {
  icon?: ComponentType<LucideProps>
  id?: string
  layout?: ConsoleLayoutMeta
  tab?: false | ConsoleTabMeta
  title?: string
}

/**
 * 解析 TanStack Router 的 staticData 为业务路由元信息。
 */
export function resolveRouteMeta(staticData: unknown): AppRouteMeta {
  if (!staticData || typeof staticData !== 'object') {
    return {}
  }

  return staticData as AppRouteMeta
}

import type { RouteComponent } from '@tanstack/react-router'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

export type FifaRouteComponent = RouteComponent

export interface FifaLayoutMeta {
  contentWidth?: 'default' | 'full'
}

export interface FifaMenuMeta {
  group?: string
  order?: number
}

export interface FifaTabMeta {
  closable?: boolean
}

export interface FifaRouteRecord {
  component: FifaRouteComponent
  icon?: ComponentType<LucideProps>
  id: string
  layout?: FifaLayoutMeta
  menu?: false | FifaMenuMeta
  path: string
  tab?: false | FifaTabMeta
  title: string
}

export interface AppRouteMeta {
  icon?: ComponentType<LucideProps>
  id?: string
  layout?: FifaLayoutMeta
  tab?: false | FifaTabMeta
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

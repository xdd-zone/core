import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * 简化后的路由元信息。
 */
export interface AppRouteMeta {
  contentWidth?: 'default' | 'full'

  /**
   * 面包屑标题。
   */
  breadcrumbTitle?: string

  /**
   * 图标。
   */
  icon?: ComponentType<LucideProps>

  /**
   * 标签页标题。
   */
  title?: string

  /**
   * 是否生成标签页。
   * @default true
   */
  tab?: boolean
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

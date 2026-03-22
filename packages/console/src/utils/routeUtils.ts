import type { AppRouteHandle } from '@/app/router/types'
import type { Tab } from '@/stores'

import { router } from '@/app/router'

import { findRouteByPath, generateTabId, hasActualComponent } from './pathUtils'

/**
 * 从路由配置中获取标签页信息
 * @param path 路由路径
 * @returns Tab对象或null
 */
export function getTabFromRoute(path: string): Tab | null {
  // 获取所有路由配置
  const allRoutes = router.routes

  // 查找匹配的路由
  const matchedRoute = findRouteByPath(allRoutes, path)

  if (!matchedRoute?.handle) {
    // 如果没有找到路由配置，尝试生成默认标签页
    const segments = path.split('/').filter(Boolean)
    if (segments.length === 0) return null

    const label = segments[segments.length - 1]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return {
      closable: true,
      id: generateTabId(path),
      label,
      path,
    }
  }

  const handle = matchedRoute.handle as AppRouteHandle

  if (!handle.title || handle.tab === false) {
    return null
  }

  // 检查路由是否有实际的组件
  // 如果没有实际组件（只是重定向或容器路由），不创建标签
  if (!hasActualComponent(matchedRoute)) {
    return null
  }

  return {
    closable: path !== '/dashboard', // 仪表盘不可关闭
    icon: handle.icon?.name, // 获取图标名称
    id: generateTabId(path),
    label: handle.title,
    path,
  }
}

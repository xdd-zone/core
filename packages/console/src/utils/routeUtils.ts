import type { MenuProps } from 'antd'
import type { RouteObject } from 'react-router'

import type { RouteHandle } from '@/router/types'
import type { Tab } from '@/stores'

import { router } from '@/router/router'
import { RouteType } from '@/router/types'

import { buildRoutePath, findRouteByPath, generateTabId, hasActualComponent, renderIcon } from './pathUtils'

type MenuItem = Required<MenuProps>['items'][number]

/**
 * 从路由配置中生成 Antd Menu 数据结构
 * @param routes 路由配置数组
 * @param t 翻译函数
 * @returns Antd Menu items 数组
 */
export function generateAntdMenuItems(routes: RouteObject[], t?: (key: string) => string): MenuItem[] {
  function processRoute(route: RouteObject & { handle?: RouteHandle }, parentPath = ''): MenuItem | null {
    const fullPath = buildRoutePath(route.path || '', parentPath)
    const handle = route.handle as RouteHandle | undefined

    // 只处理菜单类型的路由，默认为菜单类型
    const routeType = handle?.type || RouteType.MENU
    if (routeType !== RouteType.MENU) {
      return null
    }

    // 如果没有标题，跳过该路由
    if (!handle?.title) {
      return null
    }

    // 处理子路由
    let children: MenuItem[] | undefined
    if (route.children && route.children.length > 0) {
      const childMenuItems: MenuItem[] = []

      for (const childRoute of route.children) {
        const childMenuItem = processRoute(childRoute, fullPath)
        if (childMenuItem) {
          childMenuItems.push(childMenuItem)
        }
      }

      if (childMenuItems.length > 0) {
        // 按 order 排序
        children = childMenuItems.sort((a, b) => {
          const orderA = (a as { order?: number }).order || 999
          const orderB = (b as { order?: number }).order || 999
          return orderA - orderB
        })
      } else {
        // 如果有子路由定义但没有一个子路由有权限，则不显示该父级菜单
        return null
      }
    }

    // 创建菜单项
    const menuItem: MenuItem = {
      children,
      icon: renderIcon(handle?.icon),
      key: fullPath,
      label: t ? t(handle.title) : handle.title,
    }

    return menuItem
  }

  const menuItems: MenuItem[] = []

  // 处理所有路由
  for (const route of routes) {
    // 如果是根路由，处理其子路由
    if (route.path === '/' && route.children) {
      for (const childRoute of route.children) {
        const menuItem = processRoute(childRoute)
        if (menuItem) {
          menuItems.push(menuItem)
        }
      }
    } else {
      const menuItem = processRoute(route)
      if (menuItem) {
        menuItems.push(menuItem)
      }
    }
  }

  // 按 order 排序并返回
  return menuItems.sort((a, b) => {
    const orderA = (a as { order?: number }).order || 999
    const orderB = (b as { order?: number }).order || 999
    return orderA - orderB
  })
}

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

  const handle = matchedRoute.handle

  // 处理菜单和隐藏类型的路由，因为它们都可能作为标签页显示
  const routeType = handle.type || RouteType.MENU
  if ((routeType !== RouteType.MENU && routeType !== RouteType.HIDDEN) || !handle.title) {
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

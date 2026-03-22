import type { Tab } from '@/stores'
import { useEffect } from 'react'

import { useLocation } from 'react-router'

import { useTabBarStore } from '@/stores'
import { getTabFromRoute } from '@/utils/routeUtils'

/**
 * 根据路径获取标签页信息
 */
function getTabFromPath(path: string): Tab | null {
  // 使用路由配置获取标签页信息
  return getTabFromRoute(path)
}

/**
 * 路由监听Hook
 * 监听路由变化并自动添加标签页
 */
export function useRouteListener() {
  const location = useLocation()
  const { addOrActivateTab, findTabByPath } = useTabBarStore()

  useEffect(() => {
    const currentPath = location.pathname

    // 跳过登录页面和错误页面
    if (currentPath === '/login' || currentPath === '/403' || currentPath === '/404') {
      return
    }

    // 检查是否已存在该路径的标签页
    const existingTab = findTabByPath(currentPath)
    if (existingTab) {
      // 如果已存在，只需激活
      addOrActivateTab(existingTab)
      return
    }

    // 根据路径生成标签页信息
    const tab = getTabFromPath(currentPath)
    if (tab) {
      addOrActivateTab(tab)
    }
  }, [location.pathname, addOrActivateTab, findTabByPath])
}

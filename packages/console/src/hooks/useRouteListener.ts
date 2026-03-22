import type { Tab } from '@/stores'
import { useLocation, useMatches } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useTabBarStore } from '@/stores'
import { getTabFromMatch } from '@/utils/routeUtils'

/**
 * 路由监听Hook
 * 监听路由变化并自动添加标签页
 */
export function useRouteListener() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const matches = useMatches()
  const { addOrActivateTab, findTabByPath } = useTabBarStore()

  useEffect(() => {
    const currentMatch = matches[matches.length - 1]
    if (!currentMatch) {
      return
    }

    const currentPath = currentMatch.pathname
    const existingTab = findTabByPath(currentPath)
    if (existingTab) {
      addOrActivateTab(existingTab)
      return
    }

    const tab: Tab | null = getTabFromMatch(currentMatch)
    if (tab) {
      addOrActivateTab(tab)
    }
  }, [pathname, matches, addOrActivateTab, findTabByPath])
}

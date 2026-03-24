import type { Tab } from '@console/stores'
import { useTabBarStore } from '@console/stores'
import { getTabFromMatch } from '@console/utils/routeUtils'

import { useLocation, useMatches } from '@tanstack/react-router'
import { useEffect } from 'react'

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

import type { Tab } from '@console/stores'

import { resolveRouteMeta } from '@console/app/router/types'

import { generateTabId } from './pathUtils'

interface RouteMatchSnapshot {
  pathname: string
  staticData: unknown
}

/**
 * 根据当前匹配的路由生成标签页信息。
 */
export function getTabFromMatch(match: RouteMatchSnapshot): Tab | null {
  const meta = resolveRouteMeta(match.staticData)

  if (!meta.title || meta.tab === false) {
    return null
  }

  const path = match.pathname

  return {
    closable: path !== '/dashboard', // 仪表盘不可关闭
    icon: meta.icon?.name,
    id: generateTabId(path),
    label: meta.title,
    path,
  }
}

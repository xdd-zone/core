import type { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'

import type { RouteHandle } from '@/router/types'
import { Breadcrumb as AntBreadcrumb } from 'antd'
import { useTranslation } from 'react-i18next'

import { Link, useMatches } from 'react-router'

/**
 * 动态面包屑组件
 * 基于当前路由自动生成面包屑导航
 */
export function Breadcrumb() {
  const matches = useMatches()
  const { t } = useTranslation()

  // 过滤出有效的路由匹配，排除根路由和索引路由
  const validMatches = matches.filter((match) => {
    const handle = match.handle as RouteHandle | undefined
    const hasTitle = handle?.title || handle?.breadcrumbTitle
    const isNotRoot = match.pathname !== '/'
    const isNotIndex = !match.pathname.endsWith('/')

    return hasTitle && isNotRoot && isNotIndex
  })

  // 构建面包屑项目
  const breadcrumbItems: BreadcrumbItemType[] = []

  // 添加路由层级
  validMatches.forEach((match, index) => {
    const handle = match.handle as RouteHandle
    const title = handle.breadcrumbTitle || handle.title || t('unknownPage')
    const isLast = index === validMatches.length - 1

    breadcrumbItems.push({
      key: match.pathname,
      title: isLast ? (
        // 最后一项不可点击
        <span className="text-cat-muted">{t(title)}</span>
      ) : (
        // 中间项可点击
        <Link to={match.pathname} className="hover:text-primary transition-colors">
          {t(title)}
        </Link>
      ),
    })
  })

  // 如果没有有效的面包屑项目，不渲染
  if (breadcrumbItems.length <= 1) {
    return null
  }

  return <AntBreadcrumb items={breadcrumbItems} separator="/" className="text-sm md:hidden lg:block" />
}

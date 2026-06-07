import type { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'

import { resolveRouteMeta } from '@console/app/router/types'
import { Link, useMatches } from '@tanstack/react-router'
import { Breadcrumb as AntBreadcrumb } from 'antd'

import { useTranslation } from 'react-i18next'

/**
 * 动态面包屑组件
 * 基于当前路由自动生成面包屑导航
 */
export function Breadcrumb() {
  const matches = useMatches()
  const { t } = useTranslation()

  // 过滤出有效的路由匹配，排除根路由和索引路由
  const validMatches = matches.filter((match) => {
    const meta = resolveRouteMeta(match.staticData)
    const hasTitle = meta.title || meta.breadcrumbTitle
    const isNotRoot = match.pathname !== '/'

    return hasTitle && isNotRoot
  })

  // 构建面包屑项目
  const breadcrumbItems: BreadcrumbItemType[] = []

  // 添加路由层级
  validMatches.forEach((match, index) => {
    const meta = resolveRouteMeta(match.staticData)
    const title = meta.breadcrumbTitle || meta.title || 'common.loading'
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

import type { PublicCategoryMenuItem } from '@/lib/content/public-content'

import Link from 'next/link'
import { cn } from '@/lib/utils'

import { CategoryMenu } from './category-menu'
import { SITE_NAV_ITEMS } from './site-nav-items'

interface SiteNavProps {
  activeHref: (typeof SITE_NAV_ITEMS)[number]['href']
  categories?: PublicCategoryMenuItem[]
}

export function SiteNav({ activeHref, categories = [] }: SiteNavProps) {
  const totalPostCount = categories.reduce((total, category) => total + category.postCount, 0)

  return (
    <nav className="site-navbar">
      <div className="site-nav-pill scrolled">
        <Link className="site-logo" href="/" aria-label="回到首页">
          <span>XD</span>
        </Link>
        <span className="site-nav-divider" />
        {SITE_NAV_ITEMS.map((item) =>
          'menu' in item && item.menu === 'categories' && categories.length > 0 ? (
            <div className="site-nav-dropdown" key={item.href}>
              <Link
                className={cn('site-nav-link', 'site-nav-trigger', activeHref === item.href && 'active')}
                href={item.href}
              >
                {item.label}
              </Link>
              <CategoryMenu categories={categories} totalPostCount={totalPostCount} />
            </div>
          ) : (
            <Link
              key={item.href}
              className={cn('site-nav-link', activeHref === item.href && 'active')}
              href={item.href}
            >
              {item.label}
            </Link>
          ),
        )}
        <span className="site-nav-divider" />
        <a className="site-say-hi" href="mailto:hi@xidongdong.dev">
          <span className="ring" />
          <span className="inner">联系 ↗</span>
        </a>
      </div>
    </nav>
  )
}

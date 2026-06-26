import Link from 'next/link'

import { cn } from '@/lib/utils'

import { SITE_NAV_ITEMS } from './site-nav-items'

export function SiteNav({ activeHref }: { activeHref: (typeof SITE_NAV_ITEMS)[number]['href'] }) {
  return (
    <nav className="site-navbar">
      <div className="site-nav-pill scrolled">
        <Link className="site-logo" href="/" aria-label="回到首页">
          <span>XD</span>
        </Link>
        <span className="site-nav-divider" />
        {SITE_NAV_ITEMS.map((item) => (
          <Link key={item.href} className={cn('site-nav-link', activeHref === item.href && 'active')} href={item.href}>
            {item.label}
          </Link>
        ))}
        <span className="site-nav-divider" />
        <a className="site-say-hi" href="mailto:hi@xidongdong.dev">
          <span className="ring" />
          <span className="inner">联系 ↗</span>
        </a>
      </div>
    </nav>
  )
}

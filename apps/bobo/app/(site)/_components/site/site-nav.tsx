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
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4">
      <div className="site-nav-pill scrolled relative inline-flex items-center gap-[2px] rounded-full backdrop-blur-[12px] border border-white/10 bg-surface p-2 transition-[box-shadow,transform] duration-[360ms] ease-[cubic-bezier(0.23,1,0.32,1)] [&.scrolled]:shadow-[0_8px_24px_rgba(0,0,0,0.4)] [&.scrolled]:-translate-y-0.5">
        <Link
          className="relative w-9 h-9 rounded-full grid place-items-center transition-transform duration-300 hover:scale-[1.06] group/logo"
          href="/"
          aria-label="回到首页"
        >
          <div className="absolute inset-0 rounded-full p-[2px] bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] transition-transform duration-500 group-hover/logo:rotate-180" />
          <span className="relative z-1 w-[30px] h-[30px] rounded-full bg-background grid place-items-center text-[13px] italic">
            XD
          </span>
        </Link>
        <span className="w-[1px] h-5 bg-border mx-1" />
        {SITE_NAV_ITEMS.map((item) =>
          'menu' in item && item.menu === 'categories' && categories.length > 0 ? (
            <div
              className="relative group/nav after:absolute after:top-full after:left-1/2 max-md:after:left-0 after:w-[min(720px,calc(100vw-32px))] max-md:after:w-[min(340px,calc(100vw-24px))] after:h-8 after:-translate-x-1/2 max-md:after:-translate-x-[76px]"
              key={item.href}
            >
              <Link
                className={cn(
                  'text-[0.85rem] max-md:text-[0.78rem] max-md:px-2.5 max-md:py-2 rounded-full px-4 py-2 transition-[color,background-color,transform] duration-200 inline-flex items-center border-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1',
                  activeHref === item.href
                    ? 'text-foreground bg-border/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-border/50 hover:-translate-y-[1px]',
                )}
                href={item.href}
              >
                {item.label}
              </Link>
              <CategoryMenu categories={categories} totalPostCount={totalPostCount} />
            </div>
          ) : (
            <Link
              key={item.href}
              className={cn(
                'text-[0.85rem] max-md:text-[0.78rem] max-md:px-2.5 max-md:py-2 rounded-full px-4 py-2 transition-[color,background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1',
                activeHref === item.href
                  ? 'text-foreground bg-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-border/50 hover:-translate-y-[1px]',
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          ),
        )}
        <span className="w-[1px] h-5 bg-border mx-1" />
        <a
          className="relative inline-flex items-center gap-1 max-md:text-[0.78rem] text-[0.85rem] rounded-full group/hi focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
          href="mailto:hi@xidongdong.dev"
        >
          <span className="absolute inset-[-2px] rounded-full opacity-0 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] transition-opacity duration-300 ease-out group-hover/hi:opacity-100" />
          <span className="relative z-1 inline-flex items-center gap-1 bg-surface backdrop-blur-[12px] rounded-full px-4 py-2 max-md:px-2.5 max-md:py-2">
            联系 ↗
          </span>
        </a>
      </div>
    </nav>
  )
}

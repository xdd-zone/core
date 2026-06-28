import Link from 'next/link'

import { ThemeToggle } from '@/components/site/theme-toggle'

const footerLinks = [
  { href: '#', label: 'GitHub', internal: false },
  { href: '/writing', label: '博客', internal: true },
  { href: '#', label: 'RSS', internal: false },
  { href: '#', label: '即刻', internal: false },
] as const

export function SiteFooter() {
  return (
    <footer className="relative pb-10 pt-8">
      <div className="mx-auto max-w-7xl px-[clamp(24px,6vw,80px)]">
        <div className="flex items-center justify-between gap-6 border-t border-border pt-6 max-md:flex-col max-md:items-start">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label="站点底部链接">
              {footerLinks.map((item) =>
                item.internal ? (
                  <Link
                    className="text-[0.85rem] text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
                    href={item.href}
                    key={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    className="text-[0.85rem] text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
                    href={item.href}
                    key={item.label}
                  >
                    {item.label}
                  </a>
                ),
              )}
            </nav>
            <span className="text-muted-foreground opacity-30" aria-hidden="true">
              |
            </span>
            <ThemeToggle />
          </div>

          <div className="inline-flex items-center gap-2 text-[0.85rem] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-landing-pulse-dot" />
            可以交流项目、工具和文章
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import type { PublicCategoryMenuItem } from '@/lib/content/public-content'

import { ChevronDown, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

import { CategoryMenu } from './category-menu'
import { SITE_NAV_ITEMS } from './site-nav-items'

interface SiteNavProps {
  categories?: PublicCategoryMenuItem[]
}

export function SiteNav({ categories = [] }: SiteNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')
  const totalPostCount = categories.reduce((total, category) => total + category.postCount, 0)
  const pillRef = useRef<HTMLDivElement>(null)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileCategoriesExpanded, setIsMobileCategoriesExpanded] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    let ticking = false
    function update() {
      if (pillRef.current) {
        if (window.scrollY > 100) pillRef.current.classList.add('scrolled')
        else pillRef.current.classList.remove('scrolled')
      }
      ticking = false
    }
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4 pointer-events-none">
      <div
        className={cn(
          'fixed inset-0 bg-background/60 backdrop-blur-sm z-[-1] transition-opacity duration-300 md:hidden pointer-events-auto',
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'site-nav-pill relative inline-flex items-center gap-0.5 rounded-full backdrop-blur-md border border-white/10 bg-surface p-2 transition-[box-shadow,transform] duration-360 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto',
          !isMobileMenuOpen ? '[&.scrolled]:shadow-[0_8px_24px_rgba(0,0,0,0.4)] [&.scrolled]:-translate-y-0.5' : '',
        )}
        ref={pillRef}
      >
        <Link
          className="relative w-9 h-9 rounded-full grid place-items-center transition-transform duration-300 hover:scale-[1.06] group/logo shrink-0"
          href="/"
          aria-label="回到首页"
        >
          <div className="absolute inset-0 rounded-full p-0.5 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] mask-exclude transition-transform duration-500 group-hover/logo:rotate-180" />
          <span className="relative z-1 w-7.5 h-7.5 rounded-full bg-background grid place-items-center text-[13px] italic">
            XD
          </span>
        </Link>
        <span className="w-px h-5 bg-border mx-1 shrink-0" />

        <div className="max-md:hidden flex items-center gap-0.5">
          {SITE_NAV_ITEMS.map((item) =>
            'menu' in item && item.menu === 'categories' && categories.length > 0 ? (
              <div
                className="relative group/nav after:absolute after:top-full after:left-1/2 after:w-[min(720px,calc(100vw-32px))] after:h-8 after:-translate-x-1/2"
                key={item.href}
              >
                <Link
                  className={cn(
                    'text-[0.85rem] rounded-full px-4 py-2 transition-[color,background-color,transform] duration-200 inline-flex items-center border-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1',
                    isActive(item.href)
                      ? 'text-foreground bg-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-border/50 hover:-translate-y-px',
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
                  'text-[0.85rem] rounded-full px-4 py-2 transition-[color,background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1',
                  isActive(item.href)
                    ? 'text-foreground bg-border/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-border/50 hover:-translate-y-px',
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ),
          )}
          <span className="w-px h-5 bg-border mx-1" />
          <a
            className="relative inline-flex items-center gap-1 text-[0.85rem] rounded-full group/hi focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
            href="mailto:hi@xidongdong.dev"
          >
            <span className="absolute -inset-0.5 rounded-full opacity-0 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] transition-opacity duration-300 ease-out group-hover/hi:opacity-100" />
            <span className="relative z-1 inline-flex items-center gap-1 bg-surface backdrop-blur-md rounded-full px-4 py-2">
              联系 ↗
            </span>
          </a>
        </div>

        <button
          className="md:hidden relative w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-border/50 text-foreground shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={16} strokeWidth={2.5} /> : <Menu size={16} strokeWidth={2.5} />}
        </button>

        <div
          className={cn(
            'absolute top-[calc(100%+1rem)] left-1/2 -translate-x-1/2 md:hidden w-[min(320px,calc(100vw-2rem))] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-2 flex flex-col shadow-[0_16px_40px_rgba(0,0,0,0.15)] transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top',
            isMobileMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-4 scale-y-95 pointer-events-none',
          )}
        >
          {SITE_NAV_ITEMS.map((item) => {
            return 'menu' in item && item.menu === 'categories' && categories.length > 0 ? (
              <div key={item.href} className="flex flex-col border-b border-border/40">
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex-1 py-4 text-[0.95rem] transition-colors',
                      isActive(item.href)
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                  <button
                    className="py-4 pl-4 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileCategoriesExpanded((prev) => !prev)}
                    aria-label="Toggle categories"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      className={cn(
                        'transition-transform duration-300',
                        isMobileCategoriesExpanded ? 'rotate-180' : '',
                      )}
                    />
                  </button>
                </div>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
                    isMobileCategoriesExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
                  )}
                >
                  <div className="flex flex-col pb-4 ml-2">
                    <Link
                      href="/writing"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'py-2.5 text-[0.9rem] transition-colors',
                        pathname === '/writing' && !currentCategory
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      全部文章
                    </Link>
                    {categories.map((category) => {
                      const categoryHref = `/writing?category=${category.slug}`
                      return (
                        <Link
                          key={category.name}
                          href={categoryHref}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'py-2.5 text-[0.9rem] transition-colors',
                            pathname === '/writing' && currentCategory === category.slug
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {category.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'py-4 text-[0.95rem] transition-colors border-b border-border/40',
                  isActive(item.href) ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            )
          })}

          <a
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-4 text-[0.95rem] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-between group/contact"
            href="mailto:hi@xidongdong.dev"
          >
            <span>联系开发者</span>
            <span className="text-xs transition-transform duration-300 group-hover/contact:translate-x-1 group-hover/contact:-translate-y-1">
              ↗
            </span>
          </a>
        </div>
      </div>
    </nav>
  )
}

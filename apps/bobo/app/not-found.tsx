import Link from 'next/link'

import { SiteFooter } from '@/app/(site)/_components/site/site-footer'
import { SiteNav } from '@/app/(site)/_components/site/site-nav'
import { Button } from '@/components/ui/button'
import { getPublicCategoryMenu } from '@/lib/content/public-content'

export default async function NotFound() {
  const categories = await getPublicCategoryMenu().catch(() => [])

  return (
    <div className="flex min-h-[100dvh] flex-col text-foreground">
      <SiteNav categories={categories} />

      <div className="flex flex-1 flex-col">
        <div className="relative flex flex-1 flex-col items-center justify-center w-full overflow-hidden py-20">
          {/* 类似过渡页的光晕背景 */}
          <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground/5 via-background to-background opacity-50" />

          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-2 items-center">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse"
                  style={{ animationDelay: '0ms', animationDuration: '1s' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse"
                  style={{ animationDelay: '200ms', animationDuration: '1s' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-foreground/80 animate-pulse"
                  style={{ animationDelay: '400ms', animationDuration: '1s' }}
                />
              </div>

              <div className="flex flex-col items-center gap-3 text-center px-4">
                <h1 className="text-foreground text-[0.85rem] tracking-[0.25em] font-medium">秘境已锁，仙踪难觅。</h1>
                <p className="text-muted-foreground/60 text-[0.7rem] tracking-[0.15em] max-w-[280px] sm:max-w-md leading-relaxed">
                  道友且慢，此地并无机缘。你要找的卷宗似乎已被大能抹除，去别的洞府看看吧。
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="tracking-[0.2em] text-[0.75rem] px-8 h-9 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted"
            >
              <Link href="/">返回首页</Link>
            </Button>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

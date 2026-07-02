import { Suspense } from 'react'
import { getPublicCategoryMenu } from '@/lib/content/public-content'
import { getSiteShellData } from '@/lib/site'
import { SiteFooter } from './_components/site/site-footer'
import { SiteNav } from './_components/site/site-nav'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [shell, categories] = await Promise.all([getSiteShellData(), getPublicCategoryMenu().catch(() => [])])

  return (
    <div className="flex min-h-dvh flex-col text-foreground">
      <Suspense fallback={null}>
        <SiteNav categories={categories} contactEmail={shell.profile.contactEmail} navItems={shell.navigation} />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter profile={shell.profile} site={shell.site} />
    </div>
  )
}

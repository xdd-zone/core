import { getPublicCategoryMenu } from '@/lib/content/public-content'
import { SiteFooter } from './_components/site/site-footer'
import { SiteNav } from './_components/site/site-nav'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategoryMenu().catch(() => [])

  return (
    <div className="flex min-h-[100dvh] flex-col text-foreground">
      <SiteNav categories={categories} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  )
}

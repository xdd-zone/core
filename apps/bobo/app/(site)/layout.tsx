import { SiteFooter } from './_components/site/site-footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-foreground">
      {children}
      <SiteFooter />
    </div>
  )
}

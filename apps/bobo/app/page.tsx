import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '首页',
  description: '当前站点首页，保留为正式内容入口。',
}

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-end">
        <section className="w-full border-t border-border/70 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-medium tracking-[0.24em] text-fg-muted uppercase">bobo</p>
              <h1 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">首页已清空</h1>
              <p className="text-sm leading-6 text-fg-subtle md:text-base">
                当前首页只保留正式入口，演示类页面、样式试验和验证内容已经迁到独立实验路由。
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/lab">打开实验路由</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

export default function LabPage() {
  const { theme, setTheme } = useTheme()
  const themes = ['latte', 'system', 'macchiato'] as const

  return (
    <main className="min-h-screen px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-xl border border-border/70 bg-surface/90 p-6 shadow-panel backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium tracking-[0.24em] text-fg-muted uppercase">Lab</p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">当前主页演示区已迁到这里</h1>
                <p className="max-w-xl text-sm leading-6 text-fg-subtle md:text-base">
                  这个路由专门放样式试验、主题联调和一些临时验证，不再占用站点首页。
                </p>
              </div>
            </div>
            <div suppressHydrationWarning className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap gap-2">
                {themes.map((item) => (
                  <Button
                    key={item}
                    variant={item === theme ? 'default' : 'outline'}
                    className="min-w-28"
                    onClick={() => setTheme(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                <span className="rounded-sm border border-border-subtle bg-surface-muted px-3 py-1 text-fg">
                  当前主题 {theme}
                </span>
                <span className="rounded-sm border border-primary/30 bg-primary/12 px-2.5 py-1 text-primary">
                  点击上面的按钮立即切换
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl border border-border/70 bg-surface-muted/86 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-fg">语义表面</h2>
                <p className="text-sm leading-6 text-fg-subtle">
                  这几块直接验证背景、边框和前景色有没有跟着主题一起走。
                </p>
              </div>
              <span className="rounded-sm border border-border-subtle bg-surface px-3 py-1 text-xs text-fg-subtle">
                surface
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border-subtle bg-surface p-4">
                <p className="text-sm font-medium text-fg">bg-surface</p>
                <p className="mt-2 text-sm text-fg-muted">页面主要容器</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface-muted p-4">
                <p className="text-sm font-medium text-fg">bg-surface-muted</p>
                <p className="mt-2 text-sm text-fg-muted">辅助层级和分区</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4">
                <p className="text-sm font-medium text-fg">bg-surface-subtle</p>
                <p className="mt-2 text-sm text-fg-muted">更靠后的分隔层</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-6">
            <h2 className="text-lg font-semibold text-card-foreground">状态色</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-sm bg-primary/14 px-3 py-1 text-sm text-primary">Primary</span>
              <span className="rounded-sm bg-success/14 px-3 py-1 text-sm text-success">Success</span>
              <span className="rounded-sm bg-warning/18 px-3 py-1 text-sm text-warning">Warning</span>
              <span className="rounded-sm bg-info/16 px-3 py-1 text-sm text-info">Info</span>
              <span className="rounded-sm bg-destructive/14 px-3 py-1 text-sm text-destructive">Danger</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-fg-subtle">
              如果这里的状态标签在切换时能保持对比关系正常，主题映射就已经基本落稳了。
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-surface/88 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-fg">按钮样式联调</h2>
              <p className="text-sm leading-6 text-fg-subtle">
                这里用现有 `Button` 组件检查主按钮、描边按钮和危险按钮是否都吃到了新的语义变量。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>默认按钮</Button>
              <Button variant="outline">描边按钮</Button>
              <Button variant="secondary">次级按钮</Button>
              <Button variant="destructive">危险按钮</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

import { TiptapMarkdownEditor } from '@console/components/content/editor'
import { Markdown } from '@console/components/ui'
import { useSettingStore } from '@console/stores/modules/setting'
import { getPrimaryColorByTheme } from '@console/utils/theme'

import { ArrowLeftRight, FileText, NotebookPen } from 'lucide-react'
import { useState } from 'react'

import { useTranslation } from 'react-i18next'

const INITIAL_MARKDOWN = `# Tiptap 案例页

这块内容来自左侧编辑器，右侧直接复用当前项目的 Markdown 预览组件。

---

## 试试这些基础格式

- 无序列表
- **粗体**
- *斜体*

1. 有序列表
2. 第二项

> 这里可以演示引用块。

\`\`\`ts
export function hello(name: string) {
  return \`Hello, \${name}\`
}
\`\`\`
`

/**
 * Tiptap 示例页。
 * 用于演示富文本编辑、Markdown 输出和当前项目预览链路的最小接法。
 */
export function TiptapExample() {
  const { t } = useTranslation()
  const { catppuccinTheme } = useSettingStore()
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN)

  const lineCount = markdown.split('\n').length
  const characterCount = markdown.length
  const summaryItems = [
    { label: t('tiptapExample.summary.sync'), value: t('tiptapExample.summary.syncValue') },
    { label: t('tiptapExample.summary.lines'), value: String(lineCount) },
    { label: t('tiptapExample.summary.characters'), value: String(characterCount) },
  ]

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border-subtle bg-surface/72 px-4 py-4 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="text-fg-muted text-[11px] font-semibold tracking-[0.2em] uppercase">
              {t('tiptapExample.eyebrow')}
            </div>
            <div className="mt-2 flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                <NotebookPen className="size-5" />
              </div>
              <div>
                <h1 className="text-fg text-xl font-semibold tracking-tight">{t('menu.tiptapExample')}</h1>
                <p className="text-fg-muted mt-1.5 text-sm">{t('tiptapExample.description')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[44%] xl:justify-end">
            {summaryItems.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-overlay-0/16 px-2.5 py-1 text-xs"
              >
                <span className="text-fg-muted">{item.label}</span>
                <span className="font-medium text-fg">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <article className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-fg">
            <NotebookPen className="size-4 text-primary" />
            <span>{t('tiptapExample.editorTitle')}</span>
          </div>
          <p className="text-fg-muted text-sm">{t('tiptapExample.editorDescription')}</p>
          <TiptapMarkdownEditor value={markdown} onChange={setMarkdown} />
        </article>

        <article className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-fg">
            <FileText className="size-4 text-primary" />
            <span>{t('tiptapExample.previewTitle')}</span>
          </div>
          <p className="text-fg-muted text-sm">{t('tiptapExample.previewDescription')}</p>
          <div className="rounded-2xl border border-border-subtle bg-surface/85 px-5 py-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-fg-muted">
              <ArrowLeftRight className="size-3.5" />
              <span>{t('tiptapExample.previewHint')}</span>
            </div>
            <Markdown accentColor={primaryColor} catppuccinTheme={catppuccinTheme} showToc={false} value={markdown} />
          </div>
        </article>
      </section>
    </div>
  )
}

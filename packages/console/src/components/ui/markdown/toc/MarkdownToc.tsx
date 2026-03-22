import type { FC, ReactElement, RefObject } from 'react'

import type { UseTocOptions } from './types'
import { clsx } from 'clsx'

import { ArrowUp } from 'lucide-react'

import { TocActions } from './TocActions'
import { TocNav } from './TocNav'
import { TocProgress } from './TocProgress'
import { useToc } from './useToc'

interface TocProps extends Omit<UseTocOptions, 'containerRef'> {
  className?: string
  containerRef: RefObject<HTMLDivElement | null>
}

export const Toc: FC<TocProps> = ({ className, containerRef, maxLevel = 6, minLevel = 1 }): ReactElement | null => {
  const { activeId, items, progress, scrollToTop } = useToc({ containerRef, maxLevel, minLevel })
  if (items.length === 0) return null
  return (
    <aside className={clsx('sticky top-0 hidden h-fit lg:block', className)} aria-label="Table of contents">
      <div className="p-3 text-sm">
        <div className="relative">
          <TocNav items={items} activeId={activeId} />
        </div>
        <div className="border-subtle mt-3 border-t pt-3">
          <TocProgress progress={progress} />
          <button
            type="button"
            onClick={scrollToTop}
            className="text-fg-muted/60 hover:text-primary mt-3 flex cursor-pointer items-center gap-1 text-xs"
            aria-label="返回顶部"
          >
            <ArrowUp size={14} />
            返回顶部
          </button>
          <TocActions />
        </div>
      </div>
    </aside>
  )
}

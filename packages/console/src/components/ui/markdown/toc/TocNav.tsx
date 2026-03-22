import type { FC, ReactElement } from 'react'

import type { TocItem } from './types'
import { clsx } from 'clsx'

import { useEffect, useRef } from 'react'

export interface TocNavProps {
  activeId: string
  items: TocItem[]
}

export const TocNav: FC<TocNavProps> = ({ activeId, items }): ReactElement | null => {
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  // 自动滚动到高亮的标题
  useEffect(() => {
    if (!activeId) return

    const activeElement = itemRefs.current.get(activeId)
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [activeId])

  if (items.length === 0) return null

  return (
    <nav className="scrollbar-hide flex h-64 flex-col gap-y-2 overflow-y-auto pr-1">
      {items.map((it, idx) => (
        <a
          key={`${it.id}-${idx}`}
          ref={(el) => {
            if (el) {
              itemRefs.current.set(it.id, el)
            } else {
              itemRefs.current.delete(it.id)
            }
          }}
          href={`#${it.id}`}
          className={clsx(
            'block rounded px-2 py-1 transition-colors',
            activeId === it.id ? 'text-primary!' : 'text-fg-muted!',
            'hover:text-primary!',
          )}
          style={{ paddingLeft: `${Math.max(0, it.level - 2) * 12}px` }}
        >
          {it.text}
        </a>
      ))}
    </nav>
  )
}

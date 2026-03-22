import type { TocItem, UseTocOptions } from './types'

import { useCallback, useEffect, useState } from 'react'

function getHeadingLevel (tagName: string): number {
  const n = Number(tagName.replace(/^H/i, ''))
  return Number.isFinite(n) ? n : 6
}

function getScrollParent (el: HTMLElement): Window | HTMLElement {
  let node: HTMLElement | null = el.parentElement
  while (node) {
    const style = window.getComputedStyle(node)
    const overflowY = style.overflowY
    const isScrollableY =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight
    if (isScrollableY) return node
    node = node.parentElement
  }
  return window
}

/**
 * 提取标题文本，处理多种节点类型
 */
function getHeadingText (node: HTMLElement): string {
  const textFromTextNodes = Array.from(node.childNodes)
    .map((n) => (n.nodeType === Node.TEXT_NODE ? (n.textContent ?? '') : ''))
    .join('')
  const raw = textFromTextNodes.length > 0 ? textFromTextNodes : (node.textContent ?? '')
  return raw.replace(/\s*#\s*$/, '').trim()
}

/**
 * 计算 Window 滚动进度
 */
function computeProgressForWindow (container: HTMLElement,  containerRect: DOMRect,  items: TocItem[]): { activeId: string; progress: number } {
  const headings = items
    .map((item) => ({ el: document.getElementById(item.id), item }))
    .filter((x): x is { el: HTMLElement; item: TocItem } => Boolean(x.el))

  let currentId = headings[0]?.item.id ?? ''
  for (const { el, item } of headings) {
    const top = el.getBoundingClientRect().top
    if (top <= 120) currentId = item.id
    else break
  }

  const containerTop = containerRect.top + window.scrollY
  const containerHeight = Math.max(container.scrollHeight, containerRect.height)
  const viewportH = window.innerHeight
  const start = containerTop
  const end = Math.max(containerTop + containerHeight - viewportH, containerTop)
  const totalScrollable = Math.max(end - start, 1)
  const current = Math.min(Math.max(window.scrollY - start, 0), totalScrollable)
  const progress = Math.round((current / totalScrollable) * 100)

  return { activeId: currentId, progress }
}

/**
 * 计算元素内滚动进度
 */
function computeProgressForElement (container: HTMLElement,  containerRect: DOMRect,  scrollParent: HTMLElement,  items: TocItem[]): { activeId: string; progress: number } {
  const headings = items
    .map((item) => ({ el: document.getElementById(item.id), item }))
    .filter((x): x is { el: HTMLElement; item: TocItem } => Boolean(x.el))

  let currentId = headings[0]?.item.id ?? ''
  for (const { el, item } of headings) {
    const top = el.getBoundingClientRect().top
    if (top <= 120) currentId = item.id
    else break
  }

  const spRect = scrollParent.getBoundingClientRect()
  const start = containerRect.top - spRect.top + scrollParent.scrollTop
  const containerHeight = Math.max(container.scrollHeight, containerRect.height)
  const end = Math.max(start + containerHeight - scrollParent.clientHeight, start)
  const totalScrollable = Math.max(end - start, 1)
  const current = Math.min(Math.max(scrollParent.scrollTop - start, 0), totalScrollable)
  const progress = Math.round((current / totalScrollable) * 100)

  return { activeId: currentId, progress }
}

export function useToc ({
  containerRef,
  maxLevel = 6,
  minLevel = 1,
}: UseTocOptions): {
  activeId: string
  items: TocItem[]
  progress: number
  scrollToTop: () => void
} {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const nodes = Array.from(container.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'))
    const collected = nodes
      .map((el) => {
        const level = getHeadingLevel(el.tagName)
        const text = getHeadingText(el as HTMLElement)
        const id = (el as HTMLElement).id
        return { id, level, text }
      })
      .filter((h) => h.level >= minLevel && h.level <= maxLevel && h.id.length > 0 && h.text.trim().length > 0)

    setItems(collected)
  }, [containerRef, minLevel, maxLevel])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollParent = getScrollParent(container)

    const computeProgress = (): void => {
      // 每次滚动时重新获取 containerRect，因为 getBoundingClientRect() 相对于视口会变化
      const containerRect = container.getBoundingClientRect()
      const result =
        scrollParent === window
          ? computeProgressForWindow(container, containerRect, items)
          : computeProgressForElement(container, containerRect, scrollParent as HTMLElement, items)

      setActiveId(result.activeId)
      setProgress(result.progress)
    }

    computeProgress()

    const onScroll = (): void => {
      window.requestAnimationFrame(computeProgress)
    }
    const onResize = (): void => {
      window.requestAnimationFrame(computeProgress)
    }

    if (scrollParent === window) {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
    } else {
      ;(scrollParent as HTMLElement).addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
    }

    return () => {
      if (scrollParent === window) {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
      } else {
        ;(scrollParent as HTMLElement).removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
      }
    }
  }, [items, containerRef])

  const scrollToTop = useCallback((): void => {
    const container = containerRef.current
    if (!container) return
    const scrollParent = getScrollParent(container)

    const startY = scrollParent === window ? window.scrollY : (scrollParent as HTMLElement).scrollTop
    const duration = 500
    const startTime = performance.now()

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime
      const easeProgress = Math.min(elapsed / duration, 1)
      const easeValue = 1 - (1 - easeProgress) ** 3
      const currentY = startY - startY * easeValue

      if (scrollParent === window) {
        window.scrollTo(0, currentY)
      } else {
        ;(scrollParent as HTMLElement).scrollTop = currentY
      }

      if (easeProgress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [containerRef])

  return { activeId, items, progress, scrollToTop }
}

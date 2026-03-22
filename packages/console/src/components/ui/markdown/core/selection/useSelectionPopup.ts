import type { RefObject } from 'react'

import { useCallback, useEffect, useState } from 'react'

interface Position {
  left: number
  top: number
}

/**
 * useSelectionPopup：在指定容器中监听文本选择并显示复制弹窗
 * - `onMouseUp`：在容器内松开鼠标时计算选区与弹窗位置
 * - 自动在 `selectionchange`/`scroll`/`resize` 时隐藏弹窗以避免错位
 * - `copy`：将当前选中文本写入剪贴板
 */
export function useSelectionPopup(containerRef: RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [text, setText] = useState('')

  const hide = useCallback(() => {
    setVisible(false)
    setPosition(null)
    setText('')
  }, [])

  const onMouseUp = useCallback(() => {
    const container = containerRef.current
    const selection = window.getSelection()
    if (!container || !selection) {
      hide()
      return
    }
    if (selection.rangeCount === 0 || selection.isCollapsed) {
      hide()
      return
    }
    const range = selection.getRangeAt(0)
    const ancestor = range.commonAncestorContainer
    const node: Node = ancestor instanceof Node ? ancestor : container
    if (!container.contains(node)) {
      hide()
      return
    }
    const endRange = range.cloneRange()
    endRange.collapse(false)
    const rect = endRange.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const selectedText = selection.toString()
    if (selectedText.trim().length === 0) {
      hide()
      return
    }
    setText(selectedText)
    setPosition({ left: rect.right - containerRect.left + 8, top: Math.max(0, rect.top - containerRect.top - 32) })
    setVisible(true)
  }, [containerRef, hide])

  useEffect(() => {
    const onSelectionChange = () => {
      const s = window.getSelection()
      if (!s || s.isCollapsed) hide()
    }
    const onScroll = () => hide()
    const onResize = () => hide()
    document.addEventListener('selectionchange', onSelectionChange)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [hide])

  const copy = useCallback(async () => {
    if (text.length === 0) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('复制失败:', error)
    }
    hide()
  }, [text, hide])

  return { copy, hide, onMouseUp, position, text, visible }
}

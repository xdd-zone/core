import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useMobile } from '@/hooks/useMobile'
import { useTabBarStore } from '@/stores'

/**
 * 标签栏组件
 * 显示当前打开的页面标签，支持切换和关闭
 * 支持滚轮滚动和移动端触摸拖拽
 */
export function TabBar() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { activeTabId, closeTab, setActiveTab, tabs } = useTabBarStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // 处理标签页点击
  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId)
    void navigate({ to: path })
  }

  // 处理标签页关闭
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()

    const tabToClose = tabs.find((tab) => tab.id === tabId)
    if (!tabToClose || tabToClose.closable === false) {
      return
    }

    if (activeTabId === tabId) {
      const currentIndex = tabs.findIndex((tab) => tab.id === tabId)
      let targetTab = null

      if (currentIndex < tabs.length - 1) {
        targetTab = tabs[currentIndex + 1]
      } else if (currentIndex > 0) {
        targetTab = tabs[currentIndex - 1]
      } else {
        targetTab = tabs.find((tab) => tab.path === '/dashboard')
      }

      if (targetTab) {
        void navigate({ to: targetTab.path })
      }
    }

    closeTab(tabId)
  }

  // 处理滚轮事件
  const handleWheel = (e: WheelEvent) => {
    if (!scrollContainerRef.current) return

    e.preventDefault()
    const container = scrollContainerRef.current
    const scrollAmount = e.deltaY || e.deltaX
    container.scrollLeft += scrollAmount
  }

  // 移动端触摸拖拽相关状态
  const touchStartX = useRef(0)
  const touchStartScrollLeft = useRef(0)
  const isDragging = useRef(false)

  // 处理触摸开始
  const handleTouchStart = (e: TouchEvent) => {
    if (!scrollContainerRef.current) return

    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartScrollLeft.current = scrollContainerRef.current.scrollLeft
    isDragging.current = true
  }

  // 处理触摸移动
  const handleTouchMove = (e: TouchEvent) => {
    if (!scrollContainerRef.current || !isDragging.current) return

    e.preventDefault()
    const touch = e.touches[0]
    const deltaX = touchStartX.current - touch.clientX
    scrollContainerRef.current.scrollLeft = touchStartScrollLeft.current + deltaX
  }

  // 处理触摸结束
  const handleTouchEnd = () => {
    isDragging.current = false
  }

  // 绑定事件监听器
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    if (!isMobile) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    if (isMobile) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchmove', handleTouchMove, { passive: false })
      container.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      if (!isMobile) {
        container.removeEventListener('wheel', handleWheel)
      }
      if (isMobile) {
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isMobile])

  return (
    <div className="guide-tab-bar border-b border-gray-500 p-1 md:p-2">
      <div className="flex items-center justify-between">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex flex-1 items-center gap-x-1 overflow-x-hidden"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.path)}
              className={clsx(
                'flex cursor-pointer items-center gap-x-2 rounded-md border px-3 py-1.5 text-sm whitespace-nowrap transition-all select-none',
                activeTabId === tab.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-fg-muted hover:bg-surface-muted hover:text-fg border-transparent',
              )}
            >
              <span>{t(tab.label)}</span>
              {tab.closable !== false && (
                <div
                  onClick={(e) => handleTabClose(e, tab.id)}
                  className={clsx(
                    'cursor-pointer rounded-sm p-0.5 transition-colors',
                    activeTabId === tab.id ? 'hover:bg-primary/20' : 'hover:text-primary',
                  )}
                >
                  <X size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

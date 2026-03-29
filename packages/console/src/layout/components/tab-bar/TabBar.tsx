import type { Tab } from '@console/stores'
import type { MenuProps } from 'antd'
import { useMobile } from '@console/hooks/useMobile'
import { useTabBarStore } from '@console/stores'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Dropdown } from 'antd'
import { clsx } from 'clsx'
import { ArrowLeftToLine, ArrowRightToLine, RefreshCw, Trash2, X, XCircle } from 'lucide-react'

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 标签栏组件
 * 显示当前打开的页面标签，支持切换、关闭和右键菜单操作
 * 支持滚轮滚动和移动端触摸拖拽
 */
export function TabBar() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { activeTabId, closeAllTabs, closeLeftTabs, closeOtherTabs, closeRightTabs, closeTab, setActiveTab, tabs } =
    useTabBarStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  const navigateToPath = (path: null | string) => {
    if (!path) {
      return
    }

    void navigate({ to: path })
  }

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId)
    void navigate({ to: path })
  }

  const handleCloseTab = (tabId: string) => {
    navigateToPath(closeTab(tabId).nextPath)
  }

  const handleCloseOthers = (tab: Tab) => {
    navigateToPath(closeOtherTabs(tab.id).nextPath)
  }

  const handleCloseAll = () => {
    navigateToPath(closeAllTabs().nextPath)
  }

  const handleCloseLeft = (tab: Tab) => {
    navigateToPath(closeLeftTabs(tab.id).nextPath)
  }

  const handleCloseRight = (tab: Tab) => {
    navigateToPath(closeRightTabs(tab.id).nextPath)
  }

  const handleRefreshTab = async (tab: Tab) => {
    setActiveTab(tab.id)
    await navigate({ replace: true, to: tab.path })
    await router.invalidate({ sync: true })
    await queryClient.resetQueries({ type: 'active' })
  }

  const getContextMenuItems = (tab: Tab): MenuProps['items'] => {
    const targetIndex = tabs.findIndex((item) => item.id === tab.id)
    const hasClosableLeftTabs = tabs.some((item, index) => index < targetIndex && item.closable !== false)
    const hasClosableRightTabs = tabs.some((item, index) => index > targetIndex && item.closable !== false)
    const hasClosableOtherTabs = tabs.some((item) => item.id !== tab.id && item.closable !== false)
    const hasClosableTabs = tabs.some((item) => item.closable !== false)

    return [
      {
        disabled: tab.closable === false,
        icon: <X size={14} />,
        key: 'close-current',
        label: t('tabBar.closeCurrent'),
        onClick: () => handleCloseTab(tab.id),
      },
      {
        disabled: !hasClosableOtherTabs,
        icon: <XCircle size={14} />,
        key: 'close-others',
        label: t('tabBar.closeOthers'),
        onClick: () => handleCloseOthers(tab),
      },
      {
        disabled: !hasClosableLeftTabs,
        icon: <ArrowLeftToLine size={14} />,
        key: 'close-left',
        label: t('tabBar.closeLeft'),
        onClick: () => handleCloseLeft(tab),
      },
      {
        disabled: !hasClosableRightTabs,
        icon: <ArrowRightToLine size={14} />,
        key: 'close-right',
        label: t('tabBar.closeRight'),
        onClick: () => handleCloseRight(tab),
      },
      {
        disabled: !hasClosableTabs,
        icon: <Trash2 size={14} />,
        key: 'close-all',
        label: t('tabBar.closeAll'),
        onClick: () => handleCloseAll(),
      },
      {
        type: 'divider' as const,
      },
      {
        icon: <RefreshCw size={14} />,
        key: 'refresh-current',
        label: t('tabBar.refreshCurrent'),
        onClick: () => {
          void handleRefreshTab(tab)
        },
      },
    ]
  }

  const handleWheel = (e: WheelEvent) => {
    if (!scrollContainerRef.current) return

    e.preventDefault()
    const container = scrollContainerRef.current
    const scrollAmount = e.deltaY || e.deltaX
    container.scrollLeft += scrollAmount
  }

  const touchStartX = useRef(0)
  const touchStartScrollLeft = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e: TouchEvent) => {
    if (!scrollContainerRef.current) return

    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartScrollLeft.current = scrollContainerRef.current.scrollLeft
    isDragging.current = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!scrollContainerRef.current || !isDragging.current) return

    e.preventDefault()
    const touch = e.touches[0]
    const deltaX = touchStartX.current - touch.clientX
    scrollContainerRef.current.scrollLeft = touchStartScrollLeft.current + deltaX
  }

  const handleTouchEnd = () => {
    isDragging.current = false
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !activeTabId) return

    // 等 DOM 渲染完成后再定位，避免新增 tab 时元素还没挂载
    requestAnimationFrame(() => {
      const activeEl = container.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`)
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    })
  }, [activeTabId, tabs.length])

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
    <div className="guide-tab-bar border-b border-border p-1 md:p-2">
      <div className="flex items-center justify-between">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex flex-1 items-center gap-x-1 overflow-x-auto"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {tabs.map((tab) => (
            <Dropdown key={tab.id} menu={{ items: getContextMenuItems(tab) }} trigger={['contextMenu']}>
              <div
                data-tab-id={tab.id}
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
                  <button
                    type="button"
                    aria-label={t('tabBar.closeCurrent')}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTab(tab.id)
                    }}
                    className={clsx(
                      'cursor-pointer rounded-sm p-0.5 transition-colors',
                      activeTabId === tab.id ? 'hover:bg-primary/20' : 'hover:text-primary',
                    )}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </Dropdown>
          ))}
        </div>
      </div>
    </div>
  )
}

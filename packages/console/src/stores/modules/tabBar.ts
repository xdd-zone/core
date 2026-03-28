import type { BaseStore } from '../types'
import { create } from 'zustand'

import { persist } from 'zustand/middleware'

/**
 * 标签页数据接口
 */
export interface Tab {
  /** 是否可关闭 */
  closable?: boolean
  /** 图标 */
  icon?: string
  /** 标签页唯一标识 */
  id: string
  /** 显示标题 */
  label: string
  /** 路由路径 */
  path: string
}

/**
 * 标签页关闭结果
 */
export interface TabCloseResult {
  /** 关闭后需要跳转到的路径 */
  nextPath: null | string
}

/**
 * TabBar状态接口
 */
export interface TabBarState extends BaseStore {
  /** 当前激活的标签页ID */
  activeTabId: string
  /** 正在关闭的标签页路径 */
  closingPath: null | string
  /** 根据路径添加或激活标签页 */
  addOrActivateTab: (tab: Tab) => void

  /** 添加标签页 */
  addTab: (tab: Tab) => void
  /** 关闭所有标签页 */
  closeAllTabs: () => TabCloseResult
  /** 关闭左侧标签页 */
  closeLeftTabs: (tabId: string) => TabCloseResult
  /** 关闭其他标签页 */
  closeOtherTabs: (tabId: string) => TabCloseResult
  /** 关闭右侧标签页 */
  closeRightTabs: (tabId: string) => TabCloseResult
  /** 关闭标签页 */
  closeTab: (tabId: string) => TabCloseResult
  /** 根据路径查找标签页 */
  findTabByPath: (path: string) => Tab | undefined
  /** 清理关闭中的路径标记 */
  clearClosingPath: () => void
  /** 重置到默认状态 */
  reset: () => void
  /** 设置激活标签页 */
  setActiveTab: (tabId: string) => void
  /** 标签页列表 */
  tabs: Tab[]
}

/**
 * 默认首页标签
 */
const DEFAULT_HOME_TAB: Tab = {
  closable: false, // 首页不可关闭
  icon: 'Home',
  id: 'home',
  label: 'menu.dashboard',
  path: '/dashboard',
}

/**
 * 返回新的激活标签页 ID
 */
function resolveActiveTabId(tabs: Tab[], fallbackTabId?: string) {
  if (fallbackTabId && tabs.some((tab) => tab.id === fallbackTabId)) {
    return fallbackTabId
  }

  if (tabs.length > 0) {
    return tabs[0].id
  }

  return DEFAULT_HOME_TAB.id
}

/**
 * 生成关闭操作后的状态
 */
function buildCloseState(nextTabs: Tab[], fallbackTabId?: string, closingPath: null | string = null) {
  const resolvedTabs = nextTabs.length > 0 ? nextTabs : [DEFAULT_HOME_TAB]
  const resolvedActiveTabId = resolveActiveTabId(resolvedTabs, fallbackTabId)
  const activeTab = resolvedTabs.find((tab) => tab.id === resolvedActiveTabId) ?? resolvedTabs[0]

  return {
    state: {
      activeTabId: activeTab.id,
      closingPath,
      tabs: resolvedTabs,
    },
    result: {
      nextPath: closingPath ? activeTab.path : null,
    } satisfies TabCloseResult,
  }
}

/**
 * TabBar状态管理
 */
export const useTabBarStore = create<TabBarState>()(
  persist(
    (set, get) => ({
      activeTabId: DEFAULT_HOME_TAB.id,
      closingPath: null,
      addOrActivateTab: (tab: Tab) => {
        const { tabs } = get()
        const existingTab = tabs.find((t) => t.path === tab.path)

        if (existingTab) {
          // 如果标签页已存在，只激活它
          set({ activeTabId: existingTab.id })
        } else {
          // 添加新标签页并激活
          set({
            activeTabId: tab.id,
            tabs: [...tabs, tab],
          })
        }
      },

      addTab: (tab: Tab) => {
        get().addOrActivateTab(tab)
      },

      clearClosingPath: () => {
        set({ closingPath: null })
      },

      closeAllTabs: () => {
        const { activeTabId, tabs } = get()
        const unclosableTabs = tabs.filter((t) => t.closable === false)
        const activeTab = tabs.find((tab) => tab.id === activeTabId)
        const activeWillClose = activeTab ? !unclosableTabs.some((tab) => tab.id === activeTab.id) : false
        const { result, state } = buildCloseState(
          unclosableTabs,
          activeWillClose ? undefined : activeTabId,
          activeWillClose ? (activeTab?.path ?? null) : null,
        )

        set(state)
        return result
      },

      closeLeftTabs: (tabId: string) => {
        const { activeTabId, tabs } = get()
        const targetIndex = tabs.findIndex((t) => t.id === tabId)

        if (targetIndex === -1) {
          return { nextPath: null }
        }

        const nextTabs = tabs.filter((tab, index) => index >= targetIndex || tab.closable === false)
        const activeTab = tabs.find((tab) => tab.id === activeTabId)
        const activeWillClose = activeTab ? !nextTabs.some((tab) => tab.id === activeTab.id) : false
        const { result, state } = buildCloseState(
          nextTabs,
          activeWillClose ? tabId : activeTabId,
          activeWillClose ? (activeTab?.path ?? null) : null,
        )

        set(state)
        return result
      },

      closeOtherTabs: (tabId: string) => {
        const { activeTabId, tabs } = get()
        const targetTab = tabs.find((t) => t.id === tabId)

        if (!targetTab) {
          return { nextPath: null }
        }

        const newTabs = tabs.filter((t) => t.id === tabId || t.closable === false)
        const activeTab = tabs.find((tab) => tab.id === activeTabId)
        const activeWillClose = activeTab ? !newTabs.some((tab) => tab.id === activeTab.id) : false
        const { result, state } = buildCloseState(
          newTabs,
          activeWillClose ? tabId : activeTabId,
          activeWillClose ? (activeTab?.path ?? null) : null,
        )

        set(state)
        return result
      },

      closeRightTabs: (tabId: string) => {
        const { activeTabId, tabs } = get()
        const targetIndex = tabs.findIndex((t) => t.id === tabId)

        if (targetIndex === -1) {
          return { nextPath: null }
        }

        const nextTabs = tabs.filter((tab, index) => index <= targetIndex || tab.closable === false)
        const activeTab = tabs.find((tab) => tab.id === activeTabId)
        const activeWillClose = activeTab ? !nextTabs.some((tab) => tab.id === activeTab.id) : false
        const { result, state } = buildCloseState(
          nextTabs,
          activeWillClose ? tabId : activeTabId,
          activeWillClose ? (activeTab?.path ?? null) : null,
        )

        set(state)
        return result
      },

      closeTab: (tabId: string) => {
        const { activeTabId, tabs } = get()
        const tabToClose = tabs.find((t) => t.id === tabId)

        if (!tabToClose || tabToClose.closable === false) {
          return { nextPath: null }
        }

        const newTabs = tabs.filter((t) => t.id !== tabId)
        let fallbackTabId = activeTabId
        let closingPath: null | string = null
        if (activeTabId === tabId) {
          const closedIndex = tabs.findIndex((t) => t.id === tabId)
          closingPath = tabToClose.path

          if (closedIndex < newTabs.length) {
            fallbackTabId = newTabs[closedIndex].id
          } else if (newTabs.length > 0) {
            fallbackTabId = newTabs[newTabs.length - 1].id
          } else {
            fallbackTabId = DEFAULT_HOME_TAB.id
          }
        }

        const { result, state } = buildCloseState(newTabs, fallbackTabId, closingPath)
        set(state)
        return result
      },

      findTabByPath: (path: string) => {
        const { tabs } = get()
        return tabs.find((t) => t.path === path)
      },

      reset: () => {
        set({
          activeTabId: DEFAULT_HOME_TAB.id,
          closingPath: null,
          tabs: [DEFAULT_HOME_TAB],
        })
      },

      setActiveTab: (tabId: string) => {
        const { tabs } = get()
        const tab = tabs.find((t) => t.id === tabId)
        if (tab) {
          set({ activeTabId: tabId })
        }
      },

      tabs: [DEFAULT_HOME_TAB],
    }),
    {
      name: 'tab-bar-store',
      partialize: (state) => ({
        activeTabId: state.activeTabId,
        tabs: state.tabs,
      }),
    },
  ),
)

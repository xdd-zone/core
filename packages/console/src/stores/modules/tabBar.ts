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
  closeAllTabs: () => void
  /** 关闭其他标签页 */
  closeOtherTabs: (tabId: string) => void
  /** 关闭标签页 */
  closeTab: (tabId: string) => void
  /** 根据路径查找标签页 */
  findTabByPath: (path: string) => Tab | undefined
  /** 清理关闭中的路径标记 */
  clearClosingPath: () => void
  /** 重置到默认状态 */
  reset: () => void
  /** 标记当前正在关闭的路径 */
  setClosingPath: (path: null | string) => void
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

      clearClosingPath: () => {
        set({ closingPath: null })
      },

      closeAllTabs: () => {
        const { tabs } = get()
        // 只保留不可关闭的标签页
        const unclosableTabs = tabs.filter((t) => t.closable === false)

        set({
          activeTabId: unclosableTabs.length > 0 ? unclosableTabs[0].id : DEFAULT_HOME_TAB.id,
          closingPath: null,
          tabs: unclosableTabs.length > 0 ? unclosableTabs : [DEFAULT_HOME_TAB],
        })
      },

      closeOtherTabs: (tabId: string) => {
        const { tabs } = get()
        const targetTab = tabs.find((t) => t.id === tabId)

        if (!targetTab) return

        // 保留目标标签页和不可关闭的标签页
        const newTabs = tabs.filter((t) => t.id === tabId || t.closable === false)

        set({
          activeTabId: tabId,
          closingPath: null,
          tabs: newTabs,
        })
      },

      closeTab: (tabId: string) => {
        const { activeTabId, tabs } = get()
        const tabToClose = tabs.find((t) => t.id === tabId)

        // 不允许关闭不可关闭的标签页
        if (!tabToClose || tabToClose.closable === false) {
          return
        }

        const newTabs = tabs.filter((t) => t.id !== tabId)

        // 如果关闭的是当前激活的标签页，需要激活其他标签页
        let newActiveTabId = activeTabId
        if (activeTabId === tabId) {
          // 优先激活右侧标签页，如果没有则激活左侧标签页
          const closedIndex = tabs.findIndex((t) => t.id === tabId)
          if (closedIndex < newTabs.length) {
            newActiveTabId = newTabs[closedIndex].id
          } else if (newTabs.length > 0) {
            newActiveTabId = newTabs[newTabs.length - 1].id
          } else {
            // 如果没有其他标签页，激活首页
            newActiveTabId = DEFAULT_HOME_TAB.id
          }
        }

        set({
          activeTabId: newActiveTabId,
          tabs: newTabs.length > 0 ? newTabs : [DEFAULT_HOME_TAB],
        })
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

      setClosingPath: (path: null | string) => {
        set({ closingPath: path })
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

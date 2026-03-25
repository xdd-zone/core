import type { BaseStore } from '../types'
import { catppuccinThemes, getThemeById } from '@console/config/catppuccin'

import {
  calculateIsDark,
  getSystemPrefersDark,
  isDarkTheme,
  updatePrimaryColorAttribute,
  updateThemeAttribute,
} from '@console/utils/theme'
import { create } from 'zustand'

import { persist } from 'zustand/middleware'

/**
 * Catppuccin 主题定义
 */
export type CatppuccinThemeId = 'latte' | 'frappe' | 'macchiato' | 'mocha'

/**
 * 设置相关的状态接口
 */
export interface SettingState extends BaseStore {
  catppuccinTheme: CatppuccinThemeId
  initTheme: () => void
  isDark: boolean
  isMobileMenuOpen: boolean
  isSettingDrawerOpen: boolean
  isSidebarCollapsed: boolean
  language: string
  layoutMode: 'leftRight' | 'topBottom'
  resetToSystemTheme: () => void
  setCatppuccinTheme: (theme: CatppuccinThemeId) => void
  setDarkMode: (isDark: boolean) => void
  setLanguage: (language: string) => void
  setLayoutMode: (mode: 'leftRight' | 'topBottom') => void
  setMobileMenuOpen: (open: boolean) => void
  setSettingDrawerOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void
  themeMode: 'light' | 'dark' | 'system'
  toggleDarkMode: () => void
  toggleLanguage: () => void
  toggleMobileMenu: () => void
  toggleSidebarCollapsed: () => void
}

/**
 * 获取初始主题状态
 * 在 store 初始化时同步计算，避免闪烁
 */
function getInitialThemeState() {
  // 尝试从 localStorage 获取持久化的 themeMode
  let themeMode: 'light' | 'dark' | 'system' = 'system'
  // Catppuccin 默认主题
  let catppuccinTheme: 'latte' | 'frappe' | 'macchiato' | 'mocha' = 'latte'
  let language = 'zh'

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('setting-store')
      if (stored) {
        const parsed = JSON.parse(stored)
        themeMode = parsed.state?.themeMode || 'system'
        language = parsed.state?.language || 'zh'

        // 降级兼容：如果有旧数据中的 primaryColor，尝试转换为对应的 catppuccinTheme
        if (parsed.state?.catppuccinTheme) {
          catppuccinTheme = parsed.state.catppuccinTheme
        } else if (parsed.state?.primaryColor) {
          // 查找匹配的主题（通过 Blue 颜色的值）
          const theme = catppuccinThemes.find((t) =>
            t.colors.find((c) => c.name === 'Blue' && c.value === parsed.state.primaryColor),
          )
          if (theme) {
            catppuccinTheme = theme.id
          }
        }
      }
    } catch {
      // 忽略解析错误，使用默认值
    }

    // 如果是跟随系统模式，需要根据系统偏好选择正确的默认主题
    if (themeMode === 'system') {
      const isDark = getSystemPrefersDark()
      catppuccinTheme = isDark ? 'mocha' : 'latte'
    }
  }

  const isDark = calculateIsDark(themeMode)

  // 获取当前主题的 Blue 颜色值
  const theme = getThemeById(catppuccinTheme)
  const blueColor = theme?.colors.find((c) => c.name === 'Blue')
  const primaryColor = blueColor?.value || '#1e66f5'

  // 立即更新 DOM 属性，避免闪烁
  if (typeof document !== 'undefined') {
    updateThemeAttribute(catppuccinTheme)
    updatePrimaryColorAttribute(primaryColor)
  }

  return { catppuccinTheme, isDark, language, themeMode }
}

/**
 * 系统配置 Store
 *
 * 使用 Zustand 管理应用的设置状态，包括暗黑模式
 * 支持持久化到 localStorage
 */
export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => {
      const initialTheme = getInitialThemeState()

      return {
        catppuccinTheme: initialTheme.catppuccinTheme,

        initTheme: () => {
          const { catppuccinTheme, themeMode } = get()
          const isDark = calculateIsDark(themeMode)
          set({ isDark })
          updateThemeAttribute(catppuccinTheme)
        },

        isDark: initialTheme.isDark,

        isMobileMenuOpen: false,

        isSettingDrawerOpen: false,

        isSidebarCollapsed: false,

        language: initialTheme.language,

        layoutMode: 'leftRight' as const,

        reset: () => {
          set({
            catppuccinTheme: 'latte',
            isDark: false,
            isSidebarCollapsed: false,
            language: 'zh',
            layoutMode: 'leftRight' as const,
            themeMode: 'system' as const,
          })
        },

        resetToSystemTheme: () => {
          const isDark = getSystemPrefersDark()
          const newCatppuccinTheme = isDark ? 'mocha' : 'latte'
          set({ catppuccinTheme: newCatppuccinTheme, isDark, themeMode: 'system' as const })
          updateThemeAttribute(newCatppuccinTheme)

          // 更新主色
          const theme = getThemeById(newCatppuccinTheme)
          const blueColor = theme?.colors.find((c) => c.name === 'Blue')
          const primaryColor = blueColor?.value || '#1e66f5'
          updatePrimaryColorAttribute(primaryColor)
        },

        setCatppuccinTheme: (catppuccinTheme: CatppuccinThemeId) => {
          const theme = getThemeById(catppuccinTheme)
          const blueColor = theme?.colors.find((c) => c.name === 'Blue')
          const primaryColor = blueColor?.value || '#1e66f5'
          // 联动更新 isDark 状态
          const newIsDark = isDarkTheme(catppuccinTheme)
          // 联动更新 themeMode：根据主题类型直接切换为 light 或 dark
          const newThemeMode: 'light' | 'dark' = newIsDark ? 'dark' : 'light'
          set({ catppuccinTheme, isDark: newIsDark, themeMode: newThemeMode })
          updatePrimaryColorAttribute(primaryColor)
          updateThemeAttribute(catppuccinTheme)
        },

        setDarkMode: (isDark: boolean) => {
          set({ isDark })
          // 根据 isDark 选择对应的主题
          const newCatppuccinTheme: 'latte' | 'frappe' | 'macchiato' | 'mocha' = isDark ? 'mocha' : 'latte'
          set({ catppuccinTheme: newCatppuccinTheme })
          updateThemeAttribute(newCatppuccinTheme)
        },

        setLanguage: async (language: string) => {
          set({ language })
          // 动态导入 i18n 实例访问器，避免与 App.tsx 的静态导入冲突
          const { getI18nInstance } = await import('@console/i18n/instance')
          getI18nInstance().changeLanguage(language)
        },

        setLayoutMode: (layoutMode: 'leftRight' | 'topBottom') => {
          set({ layoutMode })
        },

        setMobileMenuOpen: (open: boolean) => {
          set({ isMobileMenuOpen: open })
        },

        setSettingDrawerOpen: (open: boolean) => {
          set({ isSettingDrawerOpen: open })
        },

        setSidebarCollapsed: (isSidebarCollapsed: boolean) => {
          set({ isSidebarCollapsed })
        },

        setThemeMode: (themeMode: 'light' | 'dark' | 'system') => {
          const isDark = calculateIsDark(themeMode)
          // 根据主题模式选择对应的 Catppuccin 主题
          const newCatppuccinTheme = isDark ? 'mocha' : 'latte'
          set({ catppuccinTheme: newCatppuccinTheme, isDark, themeMode })
          updateThemeAttribute(newCatppuccinTheme)

          // 更新主色
          const theme = getThemeById(newCatppuccinTheme)
          const blueColor = theme?.colors.find((c) => c.name === 'Blue')
          const primaryColor = blueColor?.value || '#1e66f5'
          updatePrimaryColorAttribute(primaryColor)
        },

        themeMode: initialTheme.themeMode,

        toggleDarkMode: () => {
          const { isDark } = get()
          const newIsDark = !isDark
          const newThemeMode = newIsDark ? 'dark' : 'light'
          // 切换时同步更新 catppuccinTheme
          const newCatppuccinTheme = newIsDark ? 'mocha' : 'latte'
          set({ catppuccinTheme: newCatppuccinTheme, isDark: newIsDark, themeMode: newThemeMode })
          updateThemeAttribute(newCatppuccinTheme)

          // 更新主色
          const theme = getThemeById(newCatppuccinTheme)
          const blueColor = theme?.colors.find((c) => c.name === 'Blue')
          const primaryColor = blueColor?.value || '#1e66f5'
          updatePrimaryColorAttribute(primaryColor)
        },

        toggleLanguage: async () => {
          const { language } = get()
          const newLanguage = language === 'zh' ? 'en' : 'zh'
          set({ language: newLanguage })
          // 动态导入 i18n 实例访问器，避免与 App.tsx 的静态导入冲突
          const { getI18nInstance } = await import('@console/i18n/instance')
          getI18nInstance().changeLanguage(newLanguage)
        },

        toggleMobileMenu: () => {
          const { isMobileMenuOpen } = get()
          set({ isMobileMenuOpen: !isMobileMenuOpen })
        },

        toggleSidebarCollapsed: () => {
          const { isSidebarCollapsed } = get()
          set({ isSidebarCollapsed: !isSidebarCollapsed })
        },
      }
    },
    {
      name: 'setting-store',
      partialize: (state) => ({
        catppuccinTheme: state.catppuccinTheme,
        language: state.language,
        layoutMode: state.layoutMode,
        themeMode: state.themeMode,
      }),
    },
  ),
)

// 监听系统主题变化
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = () => {
    const store = useSettingStore.getState()
    if (store.themeMode === 'system') {
      const isDark = getSystemPrefersDark()
      // 系统主题变化时，同步更新 catppuccinTheme
      const newCatppuccinTheme = isDark ? 'mocha' : 'latte'
      useSettingStore.setState({ catppuccinTheme: newCatppuccinTheme, isDark })
      updateThemeAttribute(newCatppuccinTheme)

      // 更新主色
      const theme = getThemeById(newCatppuccinTheme)
      const blueColor = theme?.colors.find((c) => c.name === 'Blue')
      const primaryColor = blueColor?.value || '#1e66f5'
      updatePrimaryColorAttribute(primaryColor)
    }
  }

  mediaQuery.addEventListener?.('change', handleSystemThemeChange)
}

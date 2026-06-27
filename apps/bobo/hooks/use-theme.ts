'use client'

import type { ThemeSetting } from '@/lib/theme'

import { startTransition, useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  DEFAULT_THEME_SETTING,
  FALLBACK_DARK,
  FALLBACK_LIGHT,
  resolveThemeSetting,
  THEME_STORAGE_KEY,
} from '@/lib/theme'

function getSystemTheme() {
  if (typeof window === 'undefined') return FALLBACK_DARK
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? FALLBACK_DARK : FALLBACK_LIGHT
}

function getInitialThemeSetting(): ThemeSetting {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_SETTING
  }
  return resolveThemeSetting(
    window.localStorage.getItem(THEME_STORAGE_KEY) ?? document.documentElement.dataset.themeSetting,
  )
}

export function useTheme() {
  const [themeSetting, setThemeState] = useState<ThemeSetting>(getInitialThemeSetting)

  useEffect(() => {
    const handleThemeChange = (setting: ThemeSetting) => {
      const activeTheme = setting === 'system' ? getSystemTheme() : setting
      applyTheme(activeTheme)
      document.documentElement.dataset.themeSetting = setting
      window.localStorage.setItem(THEME_STORAGE_KEY, setting)
    }

    handleThemeChange(themeSetting)

    if (themeSetting === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => handleThemeChange('system')
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [themeSetting])

  const setTheme = useCallback((next: ThemeSetting) => {
    startTransition(() => {
      setThemeState(next)
    })
  }, [])

  return { theme: themeSetting, setTheme } as const
}

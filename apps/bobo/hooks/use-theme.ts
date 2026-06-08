'use client'

import type { ThemeName } from '@/lib/theme'

import { startTransition, useCallback, useEffect, useState } from 'react'

import { applyTheme, DEFAULT_THEME, resolveTheme, THEME_STORAGE_KEY, THEMES } from '@/lib/theme'

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  return resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY) ?? document.documentElement.dataset.theme)
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeName) => {
    startTransition(() => {
      setThemeState(next)
    })
  }, [])

  return { theme, themes: THEMES, setTheme } as const
}

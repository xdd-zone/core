import { App as AntdApp, ConfigProvider } from 'antd'
import { useEffect, useRef } from 'react'
import { RouterProvider } from 'react-router'

import { router } from '@/app/router'
import { useAuthStore } from '@/modules/auth'
import { getPrimaryColorByTheme, hexToRgb } from '@/utils/theme'

import { useSettingStore } from './stores'
import { getAntdThemeConfig } from './utils/catppuccin.antd'
import './i18n' // 初始化 i18n

export function App() {
  const { catppuccinTheme } = useSettingStore()
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession)
  const hasBootstrapped = useRef(false)

  // 获取 Catppuccin 主题配置
  const themeConfig = getAntdThemeConfig(catppuccinTheme)

  // 使用当前主题的 Blue 作为主色
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)

  // 响应式更新 CSS 变量
  useEffect(() => {
    const rgb = hexToRgb(primaryColor)
    const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '30, 102, 245'
    document.documentElement.style.setProperty('--primary-color', primaryColor)
    document.documentElement.style.setProperty('--primary-color-rgb', rgbString)
  }, [primaryColor])

  useEffect(() => {
    if (hasBootstrapped.current) {
      return
    }

    hasBootstrapped.current = true
    void bootstrapSession()
  }, [bootstrapSession])

  return (
    <ConfigProvider
      theme={{
        ...themeConfig,
        token: {
          ...themeConfig.token,
          colorPrimary: primaryColor,
        },
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}

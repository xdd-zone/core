import { queryClient } from '@console/app/query-client'
import { router } from '@console/app/router'
import { getPrimaryColorByTheme } from '@console/utils/theme'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { App as AntdApp, ConfigProvider } from 'antd'

import { useSettingStore } from './stores'
import { getAntdThemeConfig } from './utils/catppuccin.antd'
import './i18n' // 初始化 i18n

export function App() {
  const { catppuccinTheme } = useSettingStore()

  // 获取 Catppuccin 主题配置
  const themeConfig = getAntdThemeConfig(catppuccinTheme)

  // 使用当前主题的 Blue 作为主色
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)

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
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

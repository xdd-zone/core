import type { ReactNode } from 'react'

import { Pattern } from '@console/components/ui'

import { LanguageButton } from '@console/layout/atoms/LanguageButton'
import { ThemeToggle } from '@console/layout/atoms/ThemeToggle'
import { useSettingStore } from '@console/stores'
import { getAntdThemeConfig } from '@console/utils/catppuccin.antd'
import { getPrimaryColorByTheme } from '@console/utils/theme'
import { ConfigProvider } from 'antd'

interface AuthContainerProps {
  children: ReactNode
}

/**
 * 认证页面容器组件
 */
export function AuthContainer({ children }: AuthContainerProps) {
  const { catppuccinTheme } = useSettingStore()
  const primaryColor = getPrimaryColorByTheme(catppuccinTheme)
  const themeConfig = getAntdThemeConfig(catppuccinTheme)

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
      <div className="relative flex h-screen flex-col items-center justify-center">
        {/* Pattern 背景 */}
        <Pattern animationDuration={6} />

        {/* 主题切换和语言切换按钮 - 使用 CSS 变量适配所有主题 */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 md:top-6 md:right-6">
          <div className="text-fg-muted hover:bg-overlay-1 cursor-pointer rounded-lg p-2 transition-all duration-200">
            <LanguageButton />
          </div>
          <div className="text-fg-muted hover:bg-overlay-0 cursor-pointer rounded-lg p-2 transition-all duration-200">
            <ThemeToggle />
          </div>
        </div>

        {/* 内容表单区域 - 使用语义化 CSS 变量适配 4 套主题 */}
        <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center md:mx-auto md:max-w-md md:px-6 md:py-8 lg:max-w-lg xl:max-w-xl">
          <div className="border-border bg-overlay-1/30 md:bg-overlay-1/50 flex h-full w-full flex-col justify-center p-6 shadow-lg backdrop-blur-xs md:h-auto md:rounded-xl md:p-8 lg:px-12 lg:py-10">
            <div className="mx-auto w-full max-w-sm">{children}</div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}

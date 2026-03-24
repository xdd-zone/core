import type { MenuItem } from '@console/utils/pathUtils'
import type { MenuProps } from 'antd'
import { useSettingStore } from '@console/stores'
import { getAntdThemeConfig } from '@console/utils/catppuccin.antd'
import { findMatchingMenuKey } from '@console/utils/pathUtils'
import { getPrimaryColorByTheme, hexToRgba } from '@console/utils/theme'

import { useLocation, useNavigate } from '@tanstack/react-router'
import { ConfigProvider, Menu } from 'antd'
import { clsx } from 'clsx'
import { useMemo } from 'react'

interface NavigationMenuProps {
  /** 自定义类名 */
  className?: string
  /** 默认选中的菜单项 */
  defaultSelectedKeys?: string[]
  /** 是否折叠（仅inline模式有效） */
  inlineCollapsed?: boolean
  /** 菜单项数据 */
  items?: MenuItem[]
  /** 菜单模式 */
  mode?: 'vertical' | 'horizontal' | 'inline'
  /** 菜单点击事件 */
  onMenuClick?: (key: string) => void
  /** 自定义样式 */
  style?: React.CSSProperties
}

/**
 * 导航菜单组件
 * 统一管理应用的导航菜单功能
 */
export function NavigationMenu({
  className,
  defaultSelectedKeys = [],
  inlineCollapsed = false,
  items = [],
  mode = 'inline',
  onMenuClick,
  style,
}: NavigationMenuProps) {
  const { catppuccinTheme, isDark } = useSettingStore()
  const navigate = useNavigate()
  const location = useLocation()

  const primaryColor = useMemo(() => getPrimaryColorByTheme(catppuccinTheme), [catppuccinTheme])
  const themeConfig = useMemo(() => getAntdThemeConfig(catppuccinTheme), [catppuccinTheme])
  const menuSelectedBg = useMemo(() => hexToRgba(primaryColor, isDark ? 0.18 : 0.12), [isDark, primaryColor])
  const popupBg = themeConfig.token?.colorBgElevated

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    // 如果有自定义点击事件，先执行
    onMenuClick?.(e.key)

    // 执行路由跳转
    const path = e.key
    if (path && typeof path === 'string' && path.startsWith('/')) {
      void navigate({ to: path })
    }
  }

  // 根据当前路由确定选中的菜单项
  const currentPath = location.pathname
  const matchingKey = findMatchingMenuKey(items, currentPath)
  const selectedKeys = matchingKey ? [matchingKey] : defaultSelectedKeys

  return (
    <ConfigProvider
      theme={{
        ...themeConfig,
        components: {
          ...themeConfig.components,
          Menu: {
            ...(themeConfig.components?.Menu ?? {}),
            activeBarBorderWidth: 0,
            darkItemBg: 'transparent',
            darkItemSelectedBg: menuSelectedBg,
            darkPopupBg: popupBg,
            darkSubMenuItemBg: 'transparent',
            itemBg: 'transparent',
            itemSelectedBg: menuSelectedBg,
            popupBg,
            subMenuItemBg: 'transparent',
          },
        },
        token: {
          ...themeConfig.token,
          colorPrimary: primaryColor,
        },
      }}
    >
      <Menu
        theme={isDark ? 'dark' : 'light'}
        selectedKeys={selectedKeys}
        mode={mode}
        items={items}
        inlineCollapsed={inlineCollapsed}
        onClick={handleMenuClick}
        style={{ width: '100%', ...style }}
        className={clsx('guide-menu', className)}
      />
    </ConfigProvider>
  )
}

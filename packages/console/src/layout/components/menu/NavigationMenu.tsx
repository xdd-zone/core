import type { MenuProps } from 'antd'

import type { MenuItem } from '@/utils/pathUtils'
import { ConfigProvider, Menu, theme } from 'antd'
import { useMemo } from 'react'

import { useLocation, useNavigate } from 'react-router'

import { useSettingStore } from '@/stores'
import { findMatchingMenuKey } from '@/utils/pathUtils'
import { getPrimaryColorByTheme, hexToRgba } from '@/utils/theme'

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
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()

  // 根据 catppuccinTheme 获取当前主题的 primaryColor
  const primaryColor = useMemo(() => {
    return getPrimaryColorByTheme(catppuccinTheme)
  }, [catppuccinTheme])

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    // 如果有自定义点击事件，先执行
    onMenuClick?.(e.key)

    // 执行路由跳转
    const path = e.key
    if (path && typeof path === 'string' && path.startsWith('/')) {
      navigate(path)
    }
  }

  // 根据当前路由确定选中的菜单项
  const currentPath = location.pathname
  const matchingKey = findMatchingMenuKey(items, currentPath)
  const selectedKeys = matchingKey ? [matchingKey] : defaultSelectedKeys

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        components: {
          Menu: {
            activeBarBorderWidth: 0,
            darkItemBg: 'rgba(255, 255, 255, 0)',
            darkItemSelectedBg: hexToRgba(token.colorPrimaryBg, 0.7),
            darkPopupBg: 'rgba(0, 0, 0, 1)',
            darkSubMenuItemBg: 'rgba(255, 255, 255, 0)',
            itemBg: 'rgba(255, 255, 255, 0)',
            itemSelectedBg: hexToRgba(token.colorPrimaryBg, 0.5),
            popupBg: 'rgba(255, 255, 255, 1)',
            subMenuItemBg: 'rgba(255, 255, 255, 0)',
          },
        },
        token: {
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
        className={`guide-menu ${className}`}
      />
    </ConfigProvider>
  )
}

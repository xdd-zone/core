import type { MenuItem } from '@fifa/utils/pathUtils'
import type { MenuProps } from 'antd'
import { useSettingStore } from '@fifa/stores'
import { getAntdThemeConfig } from '@fifa/utils/catppuccin.antd'
import { findMatchingMenuState } from '@fifa/utils/pathUtils'
import { getPrimaryColorByTheme, hexToRgba } from '@fifa/utils/theme'

import { useLocation, useNavigate } from '@tanstack/react-router'
import { ConfigProvider, Menu } from 'antd'
import { clsx } from 'clsx'
import { useCallback, useMemo } from 'react'

const EMPTY_SELECTED_KEYS: string[] = []
const EMPTY_MENU_ITEMS: MenuItem[] = []

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
  defaultSelectedKeys = EMPTY_SELECTED_KEYS,
  inlineCollapsed = false,
  items = EMPTY_MENU_ITEMS,
  mode = 'inline',
  onMenuClick,
  style,
}: NavigationMenuProps) {
  const catppuccinTheme = useSettingStore((state) => state.catppuccinTheme)
  const isDark = useSettingStore((state) => state.isDark)
  const navigate = useNavigate()
  const location = useLocation()

  const primaryColor = useMemo(() => getPrimaryColorByTheme(catppuccinTheme), [catppuccinTheme])
  const themeConfig = useMemo(() => getAntdThemeConfig(catppuccinTheme), [catppuccinTheme])
  const menuSelectedBg = useMemo(() => hexToRgba(primaryColor, isDark ? 0.18 : 0.12), [isDark, primaryColor])
  const popupBg = themeConfig.token?.colorBgElevated

  const antdTheme = useMemo(
    () => ({
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
    }),
    [menuSelectedBg, popupBg, primaryColor, themeConfig],
  )

  const menuStyle = useMemo(() => ({ width: '100%', ...style }), [style])

  const handleMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    (e) => {
      // 如果有自定义点击事件，先执行
      onMenuClick?.(e.key)

      // 执行路由跳转
      const path = e.key
      if (path && typeof path === 'string' && path.startsWith('/')) {
        void navigate({ to: path })
      }
    },
    [navigate, onMenuClick],
  )

  // 根据当前路由确定选中的菜单项
  const currentPath = location.pathname
  const { openKeys: routeOpenKeys, selectedKeys: matchedSelectedKeys } = useMemo(
    () => findMatchingMenuState(items, currentPath),
    [currentPath, items],
  )
  const selectedKeys = matchedSelectedKeys.length > 0 ? matchedSelectedKeys : defaultSelectedKeys
  const menuKey = useMemo(() => `${mode}:${routeOpenKeys.join('|')}`, [mode, routeOpenKeys])

  return (
    <ConfigProvider theme={antdTheme}>
      <Menu
        key={menuKey}
        theme={isDark ? 'dark' : 'light'}
        selectedKeys={selectedKeys}
        mode={mode}
        items={items}
        inlineCollapsed={inlineCollapsed}
        defaultOpenKeys={mode === 'inline' && !inlineCollapsed ? routeOpenKeys : undefined}
        onClick={handleMenuClick}
        style={menuStyle}
        className={clsx('guide-menu', className)}
      />
    </ConfigProvider>
  )
}

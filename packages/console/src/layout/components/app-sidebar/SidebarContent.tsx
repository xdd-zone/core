import { useTranslation } from 'react-i18next'

import { router } from '@/router'
import { useSettingStore } from '@/stores'
import { generateAntdMenuItems } from '@/utils/routeUtils'

import { NavigationMenu } from '../menu/NavigationMenu'

/**
 * 侧边栏内容组件
 * 包含导航菜单
 */
export function SidebarContent() {
  const { t } = useTranslation()
  const { isSidebarCollapsed } = useSettingStore()

  const menuItems = generateAntdMenuItems(router.routes, t)

  return (
    <nav className="flex-1 overflow-auto">
      <NavigationMenu inlineCollapsed={isSidebarCollapsed} items={menuItems} />
    </nav>
  )
}

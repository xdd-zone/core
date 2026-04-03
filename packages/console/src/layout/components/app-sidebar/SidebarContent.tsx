import { createPermissionKeySet } from '@console/app/access/access-control'
import { buildNavigationMenuItems } from '@console/app/navigation/navigation'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'

import { useSettingStore } from '@console/stores'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { NavigationMenu } from '../menu/NavigationMenu'

/**
 * 侧边栏内容组件
 * 包含导航菜单
 */
export function SidebarContent() {
  const { t } = useTranslation()
  const { isSidebarCollapsed } = useSettingStore()
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  const menuItems = buildNavigationMenuItems(t, permissionKeys)

  return (
    <nav className="flex-1 overflow-auto">
      <NavigationMenu inlineCollapsed={isSidebarCollapsed} items={menuItems} />
    </nav>
  )
}

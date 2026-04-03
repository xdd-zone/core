import { createPermissionKeySet } from '@console/app/access/access-control'
import { buildNavigationMenuItems } from '@console/app/navigation/navigation'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'
import { useSettingStore } from '@console/stores'

import { Drawer } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { NavigationMenu } from '../menu/NavigationMenu'

/**
 * 移动端左侧菜单抽屉
 * 在小屏幕显示侧边栏菜单
 */
export function MobileDrawer() {
  const { t } = useTranslation()
  const { isMobileMenuOpen, setMobileMenuOpen } = useSettingStore()
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  const menuItems = buildNavigationMenuItems(t, permissionKeys)

  const onClose = () => setMobileMenuOpen(false)

  return (
    <Drawer
      placement="left"
      open={isMobileMenuOpen}
      onClose={onClose}
      size="default"
      mask={{ closable: true }}
      classNames={{
        body: 'bg-surface',
        header: 'bg-surface-muted border-border text-fg',
        wrapper: 'text-fg',
      }}
      styles={{
        body: {
          padding: '0px',
        },
        header: {
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-fg)',
        },
        mask: {
          backgroundColor: 'color-mix(in oklab, var(--color-surface-subtle) 52%, transparent)',
        },
      }}
    >
      <NavigationMenu mode="inline" items={menuItems} />
    </Drawer>
  )
}

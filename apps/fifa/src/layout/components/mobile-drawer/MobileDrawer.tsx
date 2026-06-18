import { buildNavigationMenuItems } from '@fifa/app/navigation/navigation'
import { useSettingStore } from '@fifa/stores'

import { Drawer } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { NavigationMenu } from '../menu/NavigationMenu'

const drawerClassNames = {
  body: 'bg-surface',
  header: 'bg-surface-muted border-border text-fg',
  wrapper: 'text-fg',
}

const drawerStyles = {
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
}

/**
 * 移动端左侧菜单抽屉
 * 在小屏幕显示侧边栏菜单
 */
export function MobileDrawer() {
  const { t } = useTranslation()
  const isMobileMenuOpen = useSettingStore((state) => state.isMobileMenuOpen)
  const setMobileMenuOpen = useSettingStore((state) => state.setMobileMenuOpen)
  const menuItems = useMemo(() => buildNavigationMenuItems(t), [t])

  const onClose = () => setMobileMenuOpen(false)

  return (
    <Drawer
      placement="left"
      open={isMobileMenuOpen}
      onClose={onClose}
      size="default"
      mask={{ closable: true }}
      classNames={drawerClassNames}
      styles={drawerStyles}
    >
      <NavigationMenu mode="inline" items={menuItems} />
    </Drawer>
  )
}

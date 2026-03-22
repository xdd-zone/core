import { Drawer } from 'antd'
import { useTranslation } from 'react-i18next'

import { router } from '@/router'
import { useSettingStore } from '@/stores'
import { generateAntdMenuItems } from '@/utils/routeUtils'

import { NavigationMenu } from '../menu/NavigationMenu'

/**
 * 移动端左侧菜单抽屉
 * 在小屏幕显示侧边栏菜单
 */
export function MobileDrawer() {
  const { t } = useTranslation()
  const { isMobileMenuOpen, setMobileMenuOpen } = useSettingStore()

  const menuItems = generateAntdMenuItems(router.routes, t)

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
        mask: 'bg-black/50',
        wrapper: 'text-fg',
      }}
      styles={{
        body: {
          padding: '0px',
        },
      }}
    >
      <NavigationMenu mode="inline" items={menuItems} />
    </Drawer>
  )
}

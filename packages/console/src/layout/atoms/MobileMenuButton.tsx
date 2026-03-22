import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useSettingStore } from '@/stores'

/**
 * 移动端菜单按钮
 * 点击后打开左侧菜单抽屉
 */
export function MobileMenuButton() {
  const { t } = useTranslation()
  const { setMobileMenuOpen } = useSettingStore()

  const openDrawer = () => setMobileMenuOpen(true)

  return (
    <button
      onClick={openDrawer}
      className="hover:text-primary text-fg flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors"
      aria-label={t('tooltip.openMenu')}
    >
      <Menu size={20} />
    </button>
  )
}

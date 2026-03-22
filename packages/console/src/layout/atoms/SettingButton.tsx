import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveTooltip } from '@/components/ui'
import { useSettingStore } from '@/stores'

interface SettingButtonProps {
  className?: string
}

/**
 * 设置按钮原子组件
 */
export function SettingButton({ className }: SettingButtonProps) {
  const { t } = useTranslation()
  const { setSettingDrawerOpen } = useSettingStore()

  const handleOpenSettingDrawer = () => {
    setSettingDrawerOpen(true)
  }

  return (
    <ResponsiveTooltip title={t('tooltip.setting')}>
      <div
        onClick={handleOpenSettingDrawer}
        className={`guide-setting hover:text-primary cursor-pointer transition-colors ${className || ''}`}
      >
        <Settings size={20} />
      </div>
    </ResponsiveTooltip>
  )
}

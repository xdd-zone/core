import { ResponsiveTooltip } from '@console/components/ui'
import { useSettingStore } from '@console/stores'

import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LanguageButtonProps {
  className?: string
  onClick?: () => void
}

/**
 * 语言切换按钮原子组件
 */
export function LanguageButton({ className, onClick }: LanguageButtonProps) {
  const { t } = useTranslation()
  const { toggleLanguage } = useSettingStore()

  const handleClick = () => {
    toggleLanguage()
    onClick?.()
  }

  return (
    <ResponsiveTooltip title={t('tooltip.switchLanguage')}>
      <div
        onClick={handleClick}
        className={`guide-language hover:text-primary cursor-pointer transition-colors ${className || ''}`}
      >
        <Languages size={20} />
      </div>
    </ResponsiveTooltip>
  )
}

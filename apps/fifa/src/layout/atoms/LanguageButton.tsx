import { ResponsiveTooltip } from '@fifa/components/ui'
import { useSettingStore } from '@fifa/stores/modules/setting'

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
  const toggleLanguage = useSettingStore((state) => state.toggleLanguage)

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

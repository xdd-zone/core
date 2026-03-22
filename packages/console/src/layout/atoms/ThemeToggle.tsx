import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveTooltip } from '@/components/ui'
import { useSettingStore } from '@/stores'

interface ThemeToggleProps {
  className?: string
}

/**
 * ThemeToggle 原子组件
 * 主题切换按钮
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { isDark, toggleDarkMode } = useSettingStore()

  return (
    <ResponsiveTooltip title={isDark ? t('theme.switchToLightMode') : t('theme.switchToDarkMode')}>
      <div
        onClick={toggleDarkMode}
        className={`guide-dark-mode hover:text-primary cursor-pointer transition-colors ${className}`}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </div>
    </ResponsiveTooltip>
  )
}

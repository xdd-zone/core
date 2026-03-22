import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveTooltip } from '@/components/ui'

interface SearchButtonProps {
  className?: string
  onClick?: () => void
}

/**
 * 搜索按钮原子组件
 */
export function SearchButton({ className, onClick }: SearchButtonProps) {
  const { t } = useTranslation()

  return (
    <ResponsiveTooltip title={t('tooltip.search')}>
      <div
        onClick={onClick}
        className={`guide-search hover:text-primary cursor-pointer transition-colors ${className || ''}`}
      >
        <Search size={20} />
      </div>
    </ResponsiveTooltip>
  )
}

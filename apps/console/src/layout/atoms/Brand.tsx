import { useTranslation } from 'react-i18next'

interface BrandProps {
  className?: string
}

/**
 * Brand 原子组件
 * 可复用的品牌标题
 */
export function Brand({ className = '' }: BrandProps) {
  const { t } = useTranslation()
  return (
    <h1 className={`text-fg ml-2 overflow-hidden text-xl font-semibold whitespace-nowrap ${className}`}>
      {t('layout.brand')}
    </h1>
  )
}

import { Fullscreen } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useFullscreen, useToggle } from 'react-use'

import { ResponsiveTooltip } from '@/components/ui'

interface FullscreenButtonProps {
  className?: string
}

/**
 * 全屏按钮原子组件
 */
export function FullscreenButton({ className }: FullscreenButtonProps) {
  const { t } = useTranslation()
  const ref = useRef(document.documentElement)
  const [show, toggle] = useToggle(false)
  const isFullscreen = useFullscreen(ref, show, { onClose: () => toggle(false) })

  return (
    <ResponsiveTooltip title={isFullscreen ? t('theme.exitFullscreen') : t('theme.fullscreen')}>
      <div
        onClick={() => toggle()}
        className={`guide-fullscreen hover:text-primary cursor-pointer transition-colors ${
          isFullscreen ? 'text-primary' : ''
        } ${className || ''}`}
      >
        <Fullscreen size={20} />
      </div>
    </ResponsiveTooltip>
  )
}

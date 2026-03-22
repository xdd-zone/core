import type { TooltipProps } from 'antd'
import type { ReactElement } from 'react'

import { Tooltip } from 'antd'

import { useMobile } from '@/hooks/useMobile'

interface ResponsiveTooltipProps {
  align?: TooltipProps['align']
  arrow?: TooltipProps['arrow']
  autoAdjustOverflow?: TooltipProps['autoAdjustOverflow']
  children: ReactElement
  color?: TooltipProps['color']
  mouseEnterDelay?: TooltipProps['mouseEnterDelay']
  mouseLeaveDelay?: TooltipProps['mouseLeaveDelay']
  overlayClassName?: TooltipProps['overlayClassName']
  overlayStyle?: TooltipProps['overlayStyle']
  placement?: TooltipProps['placement']
  title?: TooltipProps['title']
  trigger?: TooltipProps['trigger']
  zIndex?: TooltipProps['zIndex']
}

/**
 * 响应式 Tooltip 组件
 * 在移动端设备上不显示 Tooltip，避免点击才显示的问题
 */
export function ResponsiveTooltip({ children, ...props }: ResponsiveTooltipProps) {
  const isMobile = useMobile()

  // 在移动端直接返回子元素，不包装 Tooltip
  if (isMobile) {
    return children
  }

  // 在桌面端正常显示 Tooltip
  return <Tooltip {...props}>{children}</Tooltip>
}

import { Avatar } from 'antd'

import sullyoon from '@/assets/images/sullyoon.jpg'

interface LogoProps {
  size?: number
}

/**
 * Logo 原子组件
 * 可复用的应用 Logo
 */
export function Logo({ size = 32 }: LogoProps) {
  return <Avatar src={sullyoon} size={size} className="shrink-0" />
}

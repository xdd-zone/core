import sullyoon from '@console/assets/images/sullyoon.jpg'

import { Avatar } from 'antd'

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

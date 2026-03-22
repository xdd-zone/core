interface GuardProps {
  children: React.ReactNode
}

/**
 * 简化的路由守卫组件
 * 不再进行认证和权限检查,直接渲染子组件
 */
export function Guard({ children }: GuardProps) {
  // 完全移除认证和权限检查
  return <>{children}</>
}

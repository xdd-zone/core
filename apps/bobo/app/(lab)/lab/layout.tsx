import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lab',
  description: '用于放置当前站点的样式演示、主题验证和后续试验页面。',
}

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

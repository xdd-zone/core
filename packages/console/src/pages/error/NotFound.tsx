import { Pattern } from '@console/components/ui'
import { useNavigate } from '@tanstack/react-router'
import { Button, Result, Space } from 'antd'

import { Home, Search } from 'lucide-react'

/**
 * 404 Not Found 页面
 */
export function NotFound() {
  const navigate = useNavigate()

  const handleGoHome = () => {
    void navigate({ to: '/' })
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Pattern 背景 */}
      <Pattern animationDuration={8} />

      {/* 内容区域 */}
      <div className="relative z-10 mx-auto w-full max-w-md px-6">
        <Result
          status="404"
          title="404"
          subTitle="抱歉，您访问的页面不存在"
          icon={<Search className="text-primary text-6xl" />}
          extra={
            <Space orientation="vertical" size="middle" className="w-full">
              <Button type="primary" size="large" icon={<Home />} onClick={handleGoHome} className="w-full">
                返回首页
              </Button>
              <Button size="large" onClick={handleGoBack} className="w-full">
                返回上一页
              </Button>
            </Space>
          }
          className="bg-cat-secondary/80 rounded-lg p-8 shadow-lg backdrop-blur-sm"
        />
      </div>
    </div>
  )
}

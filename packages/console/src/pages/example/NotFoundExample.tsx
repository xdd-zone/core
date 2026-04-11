import { ErrorStatePage } from '@console/components/ui'

import { useNavigate } from '@tanstack/react-router'
import { Button } from 'antd'
import { ArrowLeft, House, Search } from 'lucide-react'

/**
 * 404 错误示例页。
 */
export function NotFoundExample() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    window.history.back()
  }

  const handleGoHome = () => {
    void navigate({ to: '/' })
  }

  return (
    <div>
      <ErrorStatePage
        embedded
        eyebrow="404 Not Found"
        icon={<Search className="size-5" />}
        title="当前页面不存在"
        description="这个地址没有匹配到可用页面。返回首页，或回到上一页重新进入。"
        note="如果你是从旧链接进入的，建议从当前菜单重新打开对应功能。"
        actions={
          <>
            <Button type="primary" icon={<House className="size-4" />} onClick={handleGoHome}>
              首页
            </Button>
            <Button icon={<ArrowLeft className="size-4" />} onClick={handleGoBack}>
              上一页
            </Button>
          </>
        }
      />
    </div>
  )
}

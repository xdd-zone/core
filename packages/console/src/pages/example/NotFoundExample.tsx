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
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="max-w-3xl">
          <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">Example Preview</div>
          <h1 className="text-fg mt-3 text-2xl font-semibold tracking-tight">404 页面不存在示例</h1>
          <p className="text-fg-muted mt-2 text-sm leading-7">
            这个页面用于查看导航失效或地址错误时的状态设计，重点看说明是否清楚、动作是否直接，以及页面是否保留后台应有的稳定感。
          </p>
        </div>
      </section>

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

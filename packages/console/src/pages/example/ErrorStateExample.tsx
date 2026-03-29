import { ErrorStatePage } from '@console/components/ui'

import { useNavigate } from '@tanstack/react-router'
import { Button } from 'antd'
import { AlertTriangle, House, RefreshCw } from 'lucide-react'
import { useState } from 'react'

/**
 * 运行时错误示例页。
 */
export function ErrorStateExample() {
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = useState(1)

  const handleRetry = () => {
    setRetryCount((count) => count + 1)
  }

  const handleGoHome = () => {
    void navigate({ to: '/' })
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="max-w-3xl">
          <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">Example Preview</div>
          <h1 className="text-fg mt-3 text-2xl font-semibold tracking-tight">运行时错误示例</h1>
          <p className="text-fg-muted mt-2 text-sm leading-7">
            这个页面用于查看应用级错误状态在当前后台风格里的真实表现，重点看说明文案、处理动作和技术详情是不是足够清楚。
          </p>
        </div>
      </section>

      <ErrorStatePage
        embedded
        eyebrow="Error State"
        icon={<AlertTriangle className="size-5" />}
        title="当前页面暂时无法显示"
        description="页面加载时出了点问题。重试当前页面，或返回首页继续其他操作。"
        note={`当前示例里的重试按钮已经点击 ${retryCount} 次，用来确认动作反馈是不是清楚。`}
        actions={
          <>
            <Button type="primary" icon={<RefreshCw className="size-4" />} onClick={handleRetry}>
              重试
            </Button>
            <Button icon={<House className="size-4" />} onClick={handleGoHome}>
              首页
            </Button>
          </>
        }
        detailDescription="示例页保留一小块技术信息，用来确认长文本和换行表现。"
        detailItems={[
          { label: '错误名称', content: 'ApplicationError' },
          { label: '错误消息', content: '无法完成当前页面渲染，请稍后重试。' },
          {
            label: '组件堆栈',
            content: (
              <pre className="text-fg-muted max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">
                {`at ErrorStateExample (/pages/example/ErrorStateExample.tsx)
at RouteComponent (/app/router/routes.tsx)
at RootLayout (/layout/RootLayout.tsx)`}
              </pre>
            ),
          },
        ]}
      />
    </div>
  )
}

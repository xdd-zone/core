import { ErrorStatePage } from '@console/components/ui'

import { useNavigate } from '@tanstack/react-router'
import { Button } from 'antd'
import { ArrowLeft, House, Lock } from 'lucide-react'

/**
 * 403 错误示例页。
 */
export function ForbiddenExample() {
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
          <h1 className="text-fg mt-3 text-2xl font-semibold tracking-tight">403 权限错误示例</h1>
          <p className="text-fg-muted mt-2 text-sm leading-7">
            这个页面用于确认权限限制类错误在当前项目里的表达方式，重点看限制说明、后续动作和超管相关提示是否足够清楚。
          </p>
        </div>
      </section>

      <ErrorStatePage
        embedded
        eyebrow="403 Forbidden"
        icon={<Lock className="size-5" />}
        title="你当前没有权限访问这个页面"
        description="当前账号已登录，但没有这个页面的访问权限。返回首页，或回到上一页继续操作。"
        note="如果你本来应该能看到这里，请联系超管确认角色或权限配置。"
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

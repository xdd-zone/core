import { Empty, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const { Paragraph, Title } = Typography

/**
 * 文章列表页面
 * 当前仅保留占位入口。
 */
export function ArticleList() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/30 p-6">
      <div className="max-w-md text-center">
        <Title level={3}>{t('articleList.emptyTitle')}</Title>
        <Paragraph className="text-fg-muted mb-0">{t('articleList.emptyDescription')}</Paragraph>
        <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} className="mt-6" />
      </div>
    </div>
  )
}

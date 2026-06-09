import { ErrorStatePage } from '@fifa/components/ui'

import { useNavigate } from '@tanstack/react-router'
import { Button } from 'antd'
import { AlertTriangle, House, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function ErrorStateExample() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [retryCount, setRetryCount] = useState(1)

  const handleRetry = () => {
    setRetryCount((count) => count + 1)
  }

  const handleGoHome = () => {
    void navigate({ to: '/' })
  }

  return (
    <ErrorStatePage
      embedded
      eyebrow={t('example.errorState.eyebrow')}
      icon={<AlertTriangle className="size-5" />}
      title={t('example.errorState.title')}
      description={t('example.errorState.description')}
      note={t('example.errorState.note', { count: retryCount })}
      actions={
        <>
          <Button type="primary" icon={<RefreshCw className="size-4" />} onClick={handleRetry}>
            {t('common.retry')}
          </Button>
          <Button icon={<House className="size-4" />} onClick={handleGoHome}>
            {t('common.home')}
          </Button>
        </>
      }
      detailDescription={t('example.errorState.detailDescription')}
      detailItems={[
        { label: t('example.errorState.detailName'), content: 'ApplicationError' },
        { label: t('example.errorState.detailMessage'), content: t('example.errorState.mockMessage') },
        {
          label: t('example.errorState.detailStack'),
          content: (
            <pre className="text-fg-muted max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">
              {`at ErrorStateExample (/features/examples/pages/ErrorStateExample.tsx)
at RouteComponent (/app/router/routes.tsx)
at RootLayout (/layout/RootLayout.tsx)`}
            </pre>
          ),
        },
      ]}
    />
  )
}

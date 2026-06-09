import { ErrorStatePage } from '@fifa/components/ui'

import { useNavigate } from '@tanstack/react-router'
import { Button } from 'antd'
import { ArrowLeft, House, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function NotFoundExample() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleGoBack = () => {
    window.history.back()
  }

  const handleGoHome = () => {
    void navigate({ to: '/' })
  }

  return (
    <ErrorStatePage
      embedded
      eyebrow={t('example.notFound.eyebrow')}
      icon={<Search className="size-5" />}
      title={t('example.notFound.title')}
      description={t('example.notFound.description')}
      note={t('example.notFound.note')}
      actions={
        <>
          <Button type="primary" icon={<House className="size-4" />} onClick={handleGoHome}>
            {t('common.home')}
          </Button>
          <Button icon={<ArrowLeft className="size-4" />} onClick={handleGoBack}>
            {t('common.back')}
          </Button>
        </>
      }
    />
  )
}

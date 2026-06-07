import { ConsolePageHeader } from '@console/components/common'
import { Button } from 'antd'
import { Settings, SquareActivity } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Home() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title={t('home.title')}
        description={t('home.description')}
        summaryItems={[
          {
            label: t('home.summary.framework'),
            value: t('home.summary.frameworkValue'),
          },
          {
            label: t('home.summary.modules'),
            value: t('home.summary.modulesValue'),
          },
        ]}
      />

      <section className="border-border-subtle bg-surface-muted/60 rounded-lg border p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-fg flex items-center gap-2 text-sm font-medium">
              <SquareActivity size={18} />
              {t('home.shell.title')}
            </div>
            <p className="text-fg-muted mt-2 max-w-2xl text-sm leading-6">{t('home.shell.description')}</p>
          </div>
          <Button icon={<Settings size={16} />} href="/" type="primary">
            {t('home.shell.action')}
          </Button>
        </div>
      </section>
    </div>
  )
}

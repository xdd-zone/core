import type { UpdatePublicProfileRequest } from '@xdd-zone/contracts'

import { usePublicProfileQuery, useUpdatePublicProfileMutation } from '@fifa/api/profile'
import { FifaPageHeader } from '@fifa/components/common'
import { Alert, App, Button, Form, Input, Spin, Switch } from 'antd'
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface SocialLinkFormValue {
  href: string
  label: string
}

interface PublicProfileFormValues {
  availableForWork: boolean
  avatarAssetId: string
  bio: string
  contactEmail: string
  displayName: string
  location: string
  socialLinks: SocialLinkFormValue[]
}

export function PublicProfile() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [form] = Form.useForm<PublicProfileFormValues>()
  const query = usePublicProfileQuery()
  const updateMutation = useUpdatePublicProfileMutation()
  const profile = query.data?.ok ? query.data.data.profile : null
  const loadError = query.data && !query.data.ok ? query.data.error.message : undefined

  useEffect(() => {
    if (!profile) {
      return
    }

    form.setFieldsValue({
      availableForWork: profile.availableForWork ?? false,
      avatarAssetId: profile.avatarAssetId ?? '',
      bio: profile.bio ?? '',
      contactEmail: profile.contactEmail ?? '',
      displayName: profile.displayName,
      location: profile.location ?? '',
      socialLinks: profile.socialLinks,
    })
  }, [form, profile])

  const summaryItems = useMemo(
    () => [
      { label: t('site.publicProfile.summary.links'), value: profile?.socialLinks.length ?? 0 },
      {
        label: t('site.publicProfile.summary.availableForWork'),
        value: profile?.availableForWork ? t('site.publicProfile.available') : t('site.publicProfile.notAvailable'),
      },
    ],
    [profile, t],
  )

  const handleSave = async () => {
    const values = await form.validateFields()
    const payload: UpdatePublicProfileRequest = {
      availableForWork: values.availableForWork,
      avatarAssetId: values.avatarAssetId.trim() ? values.avatarAssetId.trim() : null,
      bio: values.bio.trim() ? values.bio.trim() : null,
      contactEmail: values.contactEmail.trim() ? values.contactEmail.trim() : null,
      displayName: values.displayName.trim(),
      location: values.location.trim() ? values.location.trim() : null,
      socialLinks: (values.socialLinks ?? [])
        .map((link) => ({
          href: link.href.trim(),
          label: link.label.trim(),
        }))
        .filter((link) => link.href && link.label),
    }
    const response = await updateMutation.mutateAsync(payload)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    message.success(t('site.publicProfile.saveSuccess'))
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FifaPageHeader
        title={t('site.publicProfile.title')}
        description={t('site.publicProfile.description')}
        actions={
          <>
            <Button icon={<RefreshCw className="size-4" />} loading={query.isFetching} onClick={() => query.refetch()}>
              {t('site.publicProfile.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<Save className="size-4" />}
              loading={updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              {t('site.publicProfile.save')}
            </Button>
          </>
        }
        summaryItems={summaryItems}
      />

      {loadError ? (
        <Alert type="error" showIcon message={t('site.publicProfile.loadFailed')} description={loadError} />
      ) : null}

      {profile ? (
        <Form form={form} layout="vertical" className="space-y-5">
          <section className="rounded-lg border border-border-subtle bg-surface">
            <div className="border-b border-border-subtle px-5 py-4">
              <div className="text-sm font-medium text-fg">{t('site.publicProfile.basicTitle')}</div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Form.Item
                name="displayName"
                label={t('site.publicProfile.displayName')}
                rules={[{ required: true, message: t('site.publicProfile.displayNameRequired') }]}
              >
                <Input placeholder={t('site.publicProfile.displayNamePlaceholder')} />
              </Form.Item>
              <Form.Item name="avatarAssetId" label={t('site.publicProfile.avatarAssetId')}>
                <Input placeholder={t('site.publicProfile.avatarAssetIdPlaceholder')} />
              </Form.Item>
              <Form.Item name="contactEmail" label={t('site.publicProfile.contactEmail')}>
                <Input placeholder={t('site.publicProfile.contactEmailPlaceholder')} />
              </Form.Item>
              <Form.Item name="location" label={t('site.publicProfile.location')}>
                <Input placeholder={t('site.publicProfile.locationPlaceholder')} />
              </Form.Item>
              <Form.Item
                name="availableForWork"
                label={t('site.publicProfile.availableForWork')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item name="bio" label={t('site.publicProfile.bio')} className="md:col-span-2">
                <Input.TextArea
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  placeholder={t('site.publicProfile.bioPlaceholder')}
                />
              </Form.Item>
            </div>
          </section>

          <section className="rounded-lg border border-border-subtle bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div className="text-sm font-medium text-fg">{t('site.publicProfile.socialLinks')}</div>
            </div>
            <div className="p-5">
              <Form.List name="socialLinks">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                        <Form.Item
                          {...field}
                          name={[field.name, 'label']}
                          rules={[{ required: true, message: t('site.publicProfile.socialLabelRequired') }]}
                          className="mb-0"
                        >
                          <Input placeholder={t('site.publicProfile.socialLabelPlaceholder')} />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'href']}
                          rules={[{ required: true, message: t('site.publicProfile.socialHrefRequired') }]}
                          className="mb-0"
                        >
                          <Input placeholder={t('site.publicProfile.socialHrefPlaceholder')} />
                        </Form.Item>
                        <Button danger icon={<Trash2 className="size-4" />} onClick={() => remove(field.name)} />
                      </div>
                    ))}
                    <Button icon={<Plus className="size-4" />} onClick={() => add({ href: '', label: '' })}>
                      {t('site.publicProfile.addSocialLink')}
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          </section>
        </Form>
      ) : null}
    </div>
  )
}

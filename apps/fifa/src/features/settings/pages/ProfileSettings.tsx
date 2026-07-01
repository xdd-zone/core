import type { ImageCropRef } from '@fifa/components/common'
import type { FifaProfileAccount, UpdateFifaProfileRequest } from '@xdd-zone/contracts'
import type { PixelCrop } from 'react-image-crop'
import {
  useFifaProfileQuery,
  useLinkFifaProfileSocialMutation,
  useUpdateFifaProfileMutation,
  useUploadFifaProfileAvatarMutation,
} from '@fifa/api/profile'
import { FifaPageHeader, ImageCrop } from '@fifa/components/common'
import { Alert, App, Button, Form, Input, Spin, Tag, Upload } from 'antd'
import { Camera, KeyRound, Link2, Mail, Save, UploadCloud, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SiGithub, SiGoogle } from 'react-icons/si'

type SocialProvider = 'github' | 'google'

interface ProfileFormValues {
  avatarUrl: string | null
  displayName: string
  email: string
  id: string
}

const MAX_PROFILE_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024

function getAccountLabelKey(provider: FifaProfileAccount['provider']) {
  return `profile.accountProvider.${provider}`
}

function getAvatarInitial(displayName?: string) {
  const trimmedName = displayName?.trim()

  return trimmedName ? trimmedName.slice(0, 1).toUpperCase() : 'F'
}

function resolveAvatarUrl(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null
  }

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }

  return avatarUrl
}

function getAccountIcon(provider: FifaProfileAccount['provider']) {
  if (provider === 'github') {
    return <SiGithub className="size-4" />
  }

  if (provider === 'google') {
    return <SiGoogle className="size-4" />
  }

  return <KeyRound className="size-4" />
}

interface ProfileAvatarPreviewProps {
  avatarUrl: string | null
  displayName?: string
}

function ProfileAvatarPreview({ avatarUrl, displayName }: ProfileAvatarPreviewProps) {
  const resolvedAvatarUrl = resolveAvatarUrl(avatarUrl)

  return (
    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-border-subtle bg-primary text-2xl font-semibold text-surface shadow-sm">
      {resolvedAvatarUrl ? (
        <img
          src={resolvedAvatarUrl}
          alt=""
          className="block size-full aspect-square object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{displayName ? getAvatarInitial(displayName) : <UserRound className="size-8" />}</span>
      )}
    </div>
  )
}

async function createCroppedAvatarFile(image: HTMLImageElement, crop: PixelCrop): Promise<File> {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const width = Math.max(1, Math.floor(crop.width * scaleX))
  const height = Math.max(1, Math.floor(crop.height * scaleY))
  const ctx = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height

  if (!ctx) {
    throw new Error('当前浏览器不能裁剪图片')
  }

  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, width, height, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92))

  if (!blob) {
    throw new Error('头像裁剪失败')
  }

  return new File([blob], 'avatar.webp', { type: 'image/webp' })
}

export function ProfileSettings() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [form] = Form.useForm<ProfileFormValues>()
  const profileQuery = useFifaProfileQuery()
  const updateProfileMutation = useUpdateFifaProfileMutation()
  const uploadAvatarMutation = useUploadFifaProfileAvatarMutation()
  const linkSocialMutation = useLinkFifaProfileSocialMutation()
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<PixelCrop | null>(null)
  const imageCropRef = useRef<ImageCropRef>(null)

  const profile = profileQuery.data?.ok ? profileQuery.data.data : null
  const profileErrorMessage =
    profileQuery.data && !profileQuery.data.ok
      ? profileQuery.data.error.message
      : profileQuery.error instanceof Error
        ? profileQuery.error.message
        : null
  const boundAccounts = useMemo(() => profile?.accounts.filter((account) => account.bound).length ?? 0, [profile])

  useEffect(() => {
    if (!profile) {
      return
    }

    const values = {
      avatarUrl: profile.avatarUrl,
      displayName: profile.displayName,
      email: profile.email,
      id: profile.id,
    }

    setAvatarUrl(profile.avatarUrl)
    form.setFieldsValue(values)
  }, [form, profile])

  useEffect(() => {
    return () => {
      if (cropSource) {
        URL.revokeObjectURL(cropSource)
      }
    }
  }, [cropSource])

  const handleChooseAvatar = (file: File) => {
    if (cropSource) {
      URL.revokeObjectURL(cropSource)
    }

    setCropSource(URL.createObjectURL(file))
    setCrop(null)
    return false
  }

  const handleUploadCroppedAvatar = async () => {
    const image = imageCropRef.current?.getImageElement()

    if (!image || !crop?.width || !crop.height) {
      message.warning(t('profile.avatarCropRequired'))
      return
    }

    try {
      const file = await createCroppedAvatarFile(image, crop)
      if (file.size > MAX_PROFILE_AVATAR_FILE_SIZE_BYTES) {
        message.error(t('profile.avatarTooLarge'))
        return
      }

      const response = await uploadAvatarMutation.mutateAsync(file)

      if (!response.ok) {
        message.error(response.error.message)
        return
      }

      setAvatarUrl(response.data.avatarUrl)
      form.setFieldValue('avatarUrl', response.data.avatarUrl)
      setCropSource(null)
      message.success(t('profile.avatarUploaded'))
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('profile.avatarUploadFailed'))
    }
  }

  const handleSave = async (values: ProfileFormValues) => {
    const payload: UpdateFifaProfileRequest = {
      avatarUrl,
      displayName: values.displayName,
    }
    const response = await updateProfileMutation.mutateAsync(payload)

    if (!response.ok) {
      message.error(response.error.message)
      return
    }

    message.success(t('profile.saveSuccess'))
  }

  const handleLinkSocial = async (provider: SocialProvider) => {
    const callbackURL = `${window.location.origin}/settings/profile`

    try {
      const response = await linkSocialMutation.mutateAsync({ callbackURL, provider })

      if (response.url) {
        window.location.href = response.url
        return
      }

      message.success(t('profile.linkStarted'))
      await profileQuery.refetch()
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('profile.linkFailed'))
    }
  }

  const handleRetryProfile = () => {
    void profileQuery.refetch()
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FifaPageHeader
        title={t('profile.title')}
        description={t('profile.description')}
        summaryItems={[
          { label: t('profile.summaryRole'), value: 'owner' },
          { label: t('profile.summaryAccounts'), value: `${boundAccounts}/3` },
        ]}
      />

      {profileErrorMessage ? (
        <Alert
          type="error"
          showIcon
          message={t('profile.loadFailed')}
          description={profileErrorMessage}
          action={<Button onClick={handleRetryProfile}>{t('profile.retry')}</Button>}
        />
      ) : null}

      {profile ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
              <div className="border-b border-border-subtle px-5 py-4">
                <div className="text-sm font-medium text-fg">{t('profile.avatarTitle')}</div>
                <p className="mt-1 text-sm text-fg-muted">{t('profile.avatarDescription')}</p>
              </div>

              <div className="space-y-5 p-5">
                <div className="flex items-center gap-4">
                  <ProfileAvatarPreview avatarUrl={avatarUrl} displayName={profile?.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{profile.displayName}</div>
                    <div className="mt-1 truncate text-xs text-fg-muted">{profile.email}</div>
                  </div>
                </div>

                <Upload accept="image/*" beforeUpload={handleChooseAvatar} maxCount={1} showUploadList={false}>
                  <Button icon={<UploadCloud className="size-4" />} block>
                    {t('profile.chooseAvatar')}
                  </Button>
                </Upload>

                {cropSource ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-md border border-border-subtle bg-surface-muted p-2">
                      <ImageCrop
                        ref={imageCropRef}
                        aspect={1}
                        circularCrop
                        keepSelection
                        src={cropSource}
                        onCropComplete={(crop) => setCrop(crop)}
                      />
                    </div>
                    <Button
                      type="primary"
                      icon={<Camera className="size-4" />}
                      loading={uploadAvatarMutation.isPending}
                      onClick={handleUploadCroppedAvatar}
                      block
                    >
                      {t('profile.uploadAvatar')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
              <div className="border-b border-border-subtle px-5 py-4">
                <div className="text-sm font-medium text-fg">{t('profile.basicTitle')}</div>
                <p className="mt-1 text-sm text-fg-muted">{t('profile.basicDescription')}</p>
              </div>

              <div className="p-5">
                <Form form={form} layout="vertical" onFinish={handleSave}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item
                      name="displayName"
                      label={t('profile.displayName')}
                      rules={[{ required: true, message: t('profile.displayNameRequired') }]}
                    >
                      <Input placeholder={t('profile.displayNamePlaceholder')} />
                    </Form.Item>
                    <Form.Item name="email" label={t('profile.email')}>
                      <Input disabled prefix={<Mail className="size-4" />} />
                    </Form.Item>
                  </div>
                  <Form.Item name="id" label={t('profile.userId')}>
                    <Input disabled />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<Save className="size-4" />}
                    loading={updateProfileMutation.isPending}
                  >
                    {t('profile.save')}
                  </Button>
                </Form>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-border-subtle bg-surface">
            <div className="border-b border-border-subtle px-5 py-4">
              <div className="text-sm font-medium text-fg">{t('profile.accountsTitle')}</div>
              <p className="mt-1 text-sm text-fg-muted">{t('profile.accountsDescription')}</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {profile?.accounts.map((account) => (
                <div
                  key={account.provider}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-muted text-fg">
                      {getAccountIcon(account.provider)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-fg">
                        {t(getAccountLabelKey(account.provider))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Tag color={account.bound ? 'success' : 'default'} className="m-0">
                      {account.bound ? t('profile.bound') : t('profile.notBound')}
                    </Tag>
                    {account.provider === 'github' || account.provider === 'google' ? (
                      <Button
                        size="small"
                        icon={<Link2 className="size-4" />}
                        disabled={account.bound}
                        loading={linkSocialMutation.isPending}
                        onClick={() => handleLinkSocial(account.provider as SocialProvider)}
                      >
                        {t('profile.bind')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

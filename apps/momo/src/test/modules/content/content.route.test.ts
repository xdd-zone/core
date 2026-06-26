import type {
  ApiResponse,
  CreatePostRequest,
  ImageAssetResponse,
  MdxComponentsResponse,
  PostDetailResponse,
  PostListResponse,
  PreviewPostResponse,
  PreviewTokenResponse,
} from '@xdd-zone/contracts'
import type app from '#momo/app'
import {
  AssetDetailResponseSchema,
  AssetListResponseSchema,
  BizCode,
  DeleteAssetResponseSchema,
  ImageAssetResponseSchema,
  MdxComponentsResponseSchema,
  PostDetailResponseSchema,
  PostListResponseSchema,
  PreviewPostResponseSchema,
  PreviewTokenResponseSchema,
} from '@xdd-zone/contracts'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '#momo/infra/db/client'
import { contentPosts, contentPreviewTokens } from '#momo/infra/db/schema/index'
import {
  bindFifaOwner,
  createCredentialUser,
  prepareAuthTestDatabase,
  resetAuthTestData,
  signInByEmail,
} from '#momo/test/helpers/auth-test-db'

let momoApp: typeof app
let ownerCookie: string

describe('content 路由', () => {
  beforeAll(async () => {
    await prepareAuthTestDatabase()
    momoApp = (await import('#momo/app')).default
  })

  beforeEach(async () => {
    await resetAuthTestData()
    const owner = await createCredentialUser({ email: 'content-owner@example.com', name: 'Content Owner' })
    await bindFifaOwner(owner.id)
    ownerCookie = await signInByEmail(momoApp, owner.email)
  })

  afterAll(async () => {
    const { closeDb } = await import('#momo/infra/db/client')
    await closeDb()
  })

  it('未登录请求后台文章列表被拒绝', async () => {
    const response = await momoApp.request('/rpc/content/posts')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 fifa owner 请求后台文章列表被拒绝', async () => {
    const user = await createCredentialUser({ email: 'content-normal@example.com', name: 'Normal User' })
    const cookie = await signInByEmail(momoApp, user.email)

    const response = await momoApp.request('/rpc/content/posts', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('创建文章后可以保存草稿、生成预览 token、读取预览、发布和公开读取', async () => {
    const created = await createPost({
      slug: 'hello-content',
      source: '# Hello\n\n<Callout tone="info">Hi</Callout>',
      title: 'Hello Content',
    })

    expect(created.status).toBe(201)
    const createdData = expectOkData(created.body)
    PostDetailResponseSchema.parse(createdData)
    expect(createdData.post.slug).toBe('hello-content')
    const postId = createdData.post.id

    const draftResponse = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({
        excerpt: 'draft excerpt',
        source: '# Hello draft',
        title: 'Hello Draft',
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const draftBody = (await draftResponse.json()) as ApiResponse<PostDetailResponse>

    expect(draftResponse.status).toBe(200)
    const draftData = expectOkData(draftBody)
    PostDetailResponseSchema.parse(draftData)
    expect(draftData.post.title).toBe('Hello Draft')
    expect(draftData.post.source).toBe('# Hello draft')

    const tokenResponse = await momoApp.request(`/rpc/content/posts/${postId}/preview-token`, {
      headers: {
        cookie: ownerCookie,
      },
      method: 'POST',
    })
    const tokenBody = (await tokenResponse.json()) as ApiResponse<PreviewTokenResponse>

    expect(tokenResponse.status).toBe(200)
    const tokenData = expectOkData(tokenBody)
    PreviewTokenResponseSchema.parse(tokenData)
    expect(tokenData.token).toEqual(expect.any(String))

    const previewResponse = await momoApp.request(`/rpc/content/previews/${tokenData.token}`)
    const previewBody = (await previewResponse.json()) as ApiResponse<PreviewPostResponse>

    expect(previewResponse.status).toBe(200)
    const previewData = expectOkData(previewBody)
    PreviewPostResponseSchema.parse(previewData)
    expect(previewData.post.id).toBe(postId)
    expect(previewData.revision.source).toBe('# Hello draft')

    const publishResponse = await momoApp.request(`/rpc/content/posts/${postId}/publish`, {
      headers: {
        cookie: ownerCookie,
      },
      method: 'POST',
    })
    const publishBody = (await publishResponse.json()) as ApiResponse<PostDetailResponse>

    expect(publishResponse.status).toBe(200)
    const publishData = expectOkData(publishBody)
    PostDetailResponseSchema.parse(publishData)
    expect(publishData.post.status).toBe('published')

    const publicListResponse = await momoApp.request('/rpc/content/public/posts')
    const publicListBody = (await publicListResponse.json()) as ApiResponse<PostListResponse>

    expect(publicListResponse.status).toBe(200)
    const publicListData = expectOkData(publicListBody)
    PostListResponseSchema.parse(publicListData)
    expect(publicListData.posts).toHaveLength(1)

    const publicResponse = await momoApp.request('/rpc/content/public/posts/hello-content')
    const publicBody = (await publicResponse.json()) as ApiResponse<PostDetailResponse>

    expect(publicResponse.status).toBe(200)
    const publicData = expectOkData(publicBody)
    PostDetailResponseSchema.parse(publicData)
    expect(publicData.post.source).toBe('# Hello draft')
  })

  it('保存草稿时 null 会清空可空字段', async () => {
    const image = await uploadImage('photo.png')
    const imageData = expectOkData(image.body)

    const created = await createPost({
      coverAssetId: imageData.asset.id,
      excerpt: 'initial excerpt',
      slug: 'clear-null-fields',
      source: '# Clear',
      title: 'Clear Fields',
    })
    const postId = expectOkData(created.body).post.id

    const response = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({
        coverAssetId: null,
        excerpt: null,
        source: '# Cleared',
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<PostDetailResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    PostDetailResponseSchema.parse(data)
    expect(data.post.coverAssetId).toBeNull()
    expect(data.post.excerpt).toBeNull()
  })

  it('创建文章时 coverAssetId 不存在会返回 404', async () => {
    const response = await createPost({
      coverAssetId: 'missing-asset',
      slug: 'missing-cover-asset',
      source: '# Missing asset',
      title: 'Missing Asset',
    })

    expect(response.status).toBe(404)
    expect(response.body.ok).toBe(false)
    expect(!response.body.ok && response.body.error.code).toBe(BizCode.COMMON_NOT_FOUND)
  })

  it('保存草稿时 coverAssetId 不存在会返回 404', async () => {
    const created = await createPost({
      slug: 'missing-draft-cover-asset',
      source: '# Missing draft asset',
      title: 'Missing Draft Asset',
    })
    const postId = expectOkData(created.body).post.id

    const response = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({
        coverAssetId: 'missing-asset',
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(404)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.COMMON_NOT_FOUND)
  })

  it('slug 冲突会被拒绝', async () => {
    await createPost({
      slug: 'same-slug',
      source: '# One',
      title: 'One',
    })

    const response = await createPost({
      slug: 'same-slug',
      source: '# Two',
      title: 'Two',
    })

    expect(response.status).toBe(409)
    expect(response.body.ok).toBe(false)
    expect(!response.body.ok && response.body.error.code).toBe(BizCode.CONTENT_SLUG_CONFLICT)
  })

  it('未知 MDX 组件会被拒绝', async () => {
    const response = await createPost({
      slug: 'bad-mdx',
      source: '<UnknownBlock />',
      title: 'Bad MDX',
    })

    expect(response.status).toBe(422)
    expect(response.body.ok).toBe(false)
    expect(!response.body.ok && response.body.error.code).toBe(BizCode.CONTENT_UNKNOWN_MDX_COMPONENT)
  })

  it('普通正文里的未知组件会被拒绝', async () => {
    const response = await createPost({
      slug: 'unknown-component-in-body',
      source: '# Body\n\n<UnknownBlock />',
      title: 'Unknown Component Body',
    })

    expect(response.status).toBe(422)
    expect(response.body.ok).toBe(false)
    expect(!response.body.ok && response.body.error.code).toBe(BizCode.CONTENT_UNKNOWN_MDX_COMPONENT)
  })

  it('文章指向的草稿版本丢失时返回系统错误', async () => {
    const created = await createPost({
      slug: 'missing-draft-revision',
      source: '# Missing draft revision',
      title: 'Missing Draft Revision',
    })
    const postId = expectOkData(created.body).post.id

    await getDb().update(contentPosts).set({ draftRevisionId: 'missing-revision' }).where(eq(contentPosts.id, postId))

    const response = await momoApp.request(`/rpc/content/posts/${postId}`, {
      headers: {
        cookie: ownerCookie,
      },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(500)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.SYSTEM_INTERNAL_ERROR)
  })

  it('过期预览 token 会被拒绝', async () => {
    const created = await createPost({
      slug: 'expired-token',
      source: '# Expired',
      title: 'Expired',
    })
    const postId = created.body.ok ? created.body.data.post.id : ''
    const tokenResponse = await momoApp.request(`/rpc/content/posts/${postId}/preview-token`, {
      headers: {
        cookie: ownerCookie,
      },
      method: 'POST',
    })
    const tokenBody = (await tokenResponse.json()) as ApiResponse<PreviewTokenResponse>

    await getDb()
      .update(contentPreviewTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(contentPreviewTokens.postId, postId))

    const response = await momoApp.request(`/rpc/content/previews/${tokenBody.ok ? tokenBody.data.token : ''}`)
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED)
  })

  it('素材可以列表、读取详情、读取文件、更新说明和删除', async () => {
    const firstAsset = await uploadImage('first.png')
    const secondAsset = await uploadImage('second.png')
    const firstAssetData = expectOkData(firstAsset.body)
    const secondAssetData = expectOkData(secondAsset.body)

    const listResponse = await momoApp.request('/rpc/content/assets?page=1&pageSize=10', {
      headers: {
        cookie: ownerCookie,
      },
    })
    const listBody = (await listResponse.json()) as ApiResponse<unknown>

    expect(listResponse.status).toBe(200)
    const listData = expectOkData(listBody)
    AssetListResponseSchema.parse(listData)
    expect(
      (listData as { assets: Array<{ id: string }> }).assets.some((asset) => asset.id === firstAssetData.asset.id),
    ).toBe(true)

    const detailResponse = await momoApp.request(`/rpc/content/assets/${firstAssetData.asset.id}`, {
      headers: {
        cookie: ownerCookie,
      },
    })
    const detailBody = (await detailResponse.json()) as ApiResponse<unknown>

    expect(detailResponse.status).toBe(200)
    const detailData = expectOkData(detailBody)
    AssetDetailResponseSchema.parse(detailData)
    expect((detailData as { asset: { id: string } }).asset.id).toBe(firstAssetData.asset.id)

    const fileResponse = await momoApp.request(`/rpc/content/assets/${firstAssetData.asset.id}/file`)
    expect(fileResponse.status).toBe(200)
    expect(fileResponse.headers.get('content-type')).toBe('image/png')

    const updateResponse = await momoApp.request(`/rpc/content/assets/${firstAssetData.asset.id}`, {
      body: JSON.stringify({ alt: 'cover alt' }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const updateBody = (await updateResponse.json()) as ApiResponse<ImageAssetResponse>

    expect(updateResponse.status).toBe(200)
    const updateData = expectOkData(updateBody)
    ImageAssetResponseSchema.parse(updateData)
    expect(updateData.asset.alt).toBe('cover alt')

    const post = await createPost({
      coverAssetId: firstAssetData.asset.id,
      slug: 'cover-asset-in-use',
      source: '# Cover asset in use',
      title: 'Cover Asset In Use',
    })
    expect(post.status).toBe(201)

    const rejectDeleteResponse = await momoApp.request(`/rpc/content/assets/${firstAssetData.asset.id}`, {
      headers: {
        cookie: ownerCookie,
      },
      method: 'DELETE',
    })
    const rejectDeleteBody = (await rejectDeleteResponse.json()) as ApiResponse<never>

    expect(rejectDeleteResponse.status).toBe(409)
    expect(rejectDeleteBody.ok).toBe(false)
    expect(!rejectDeleteBody.ok && rejectDeleteBody.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)

    const deleteResponse = await momoApp.request(`/rpc/content/assets/${secondAssetData.asset.id}`, {
      headers: {
        cookie: ownerCookie,
      },
      method: 'DELETE',
    })
    const deleteBody = (await deleteResponse.json()) as ApiResponse<unknown>

    expect(deleteResponse.status).toBe(200)
    const deleteData = expectOkData(deleteBody)
    DeleteAssetResponseSchema.parse(deleteData)
    expect((deleteData as { assetId: string }).assetId).toBe(secondAssetData.asset.id)

    const afterDeleteResponse = await momoApp.request(`/rpc/content/assets/${secondAssetData.asset.id}`, {
      headers: { cookie: ownerCookie },
    })
    expect(afterDeleteResponse.status).toBe(404)
  })

  it('未登录请求素材接口被拒绝', async () => {
    const response = await momoApp.request('/rpc/content/assets')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 fifa owner 请求素材接口被拒绝', async () => {
    const user = await createCredentialUser({ email: 'asset-normal@example.com', name: 'Normal User' })
    const cookie = await signInByEmail(momoApp, user.email)

    const response = await momoApp.request('/rpc/content/assets', { headers: { cookie } })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('素材被草稿正文引用时不能删除', async () => {
    const uploaded = await uploadImage('referenced.png')
    const assetData = expectOkData(uploaded.body)
    const assetUrl = assetData.asset.url

    if (!assetUrl) {
      return
    }

    await createPost({
      slug: 'url-in-draft',
      source: `<Figure src="${assetUrl}" alt="test" />`,
      title: 'URL In Draft',
    })

    const response = await momoApp.request(`/rpc/content/assets/${assetData.asset.id}`, {
      headers: { cookie: ownerCookie },
      method: 'DELETE',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(409)
    expect(!body.ok && body.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)
  })

  it('上传图片会保存素材记录', async () => {
    const result = await uploadImage('photo.png')

    expect(result.status).toBe(201)
    const data = expectOkData(result.body)
    ImageAssetResponseSchema.parse(data)
    expect(data.asset.mimeType).toBe('image/png')
    expect(data.asset.size).toBe(8)
  })

  it('返回 MDX 组件清单', async () => {
    const response = await momoApp.request('/rpc/content/mdx-components', {
      headers: {
        cookie: ownerCookie,
      },
    })
    const body = (await response.json()) as ApiResponse<MdxComponentsResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    MdxComponentsResponseSchema.parse(data)
    expect(data.components.map((component) => component.name)).toEqual([
      'Callout',
      'Figure',
      'LinkCard',
      'ThemePreview',
    ])
  })
})

async function createPost(input: CreatePostRequest) {
  const response = await momoApp.request('/rpc/content/posts', {
    body: JSON.stringify(input),
    headers: jsonHeaders(ownerCookie),
    method: 'POST',
  })
  const body = (await response.json()) as ApiResponse<PostDetailResponse>

  return {
    body,
    status: response.status,
  }
}

async function uploadImage(fileName: string) {
  const form = new FormData()
  form.set('file', new File([Buffer.from('png-data')], fileName, { type: 'image/png' }))

  const response = await momoApp.request('/rpc/content/assets/images', {
    body: form,
    headers: {
      cookie: ownerCookie,
    },
    method: 'POST',
  })
  const body = (await response.json()) as ApiResponse<ImageAssetResponse>

  expect(response.status).toBe(201)
  const data = expectOkData(body)
  ImageAssetResponseSchema.parse(data)

  return {
    body,
    status: response.status,
  }
}

function expectOkData<T>(body: ApiResponse<T>): T {
  expect(body.ok).toBe(true)

  if (!body.ok) {
    throw new Error(body.error.message)
  }

  return body.data
}

function jsonHeaders(cookie: string) {
  return {
    'content-type': 'application/json',
    cookie,
  }
}

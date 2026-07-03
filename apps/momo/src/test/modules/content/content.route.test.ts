import type {
  ApiResponse,
  CreatePostRequest,
  GeneratePostMetaResponse,
  ImageAssetResponse,
  MdxComponentsResponse,
  PostDetailResponse,
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
  PreviewPostResponseSchema,
  PreviewTokenResponseSchema,
  PublicCategoryListResponseSchema,
  PublicPostListResponseSchema,
  PublicPostResponseSchema,
  PublicTagListResponseSchema,
} from '@xdd-zone/contracts'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '#momo/infra/db/client'
import { contentPostRevisions, contentPosts, contentPreviewTokens } from '#momo/infra/db/schema/index'
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

  it('llm 未启用时生成文章字段建议会返回 409', async () => {
    const response = await momoApp.request('/rpc/content/posts/meta-suggestion', {
      body: JSON.stringify({
        mode: 'create',
        targets: ['slug'],
        title: 'Hello Content',
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<GeneratePostMetaResponse>

    expect(response.status).toBe(409)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)
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
    expect(createdData.post.draft.slug).toBe('hello-content')
    const postId = createdData.post.id

    const draftResponse = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({
        draft: {
          excerpt: 'draft excerpt',
          source: '# Hello draft',
          title: 'Hello Draft',
        },
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const draftBody = (await draftResponse.json()) as ApiResponse<PostDetailResponse>

    expect(draftResponse.status).toBe(200)
    const draftData = expectOkData(draftBody)
    PostDetailResponseSchema.parse(draftData)
    expect(draftData.post.draft.title).toBe('Hello Draft')
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

    const previewResponse = await momoApp.request(`/rpc/previews/${tokenData.token}`)
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

    const publicListResponse = await momoApp.request('/rpc/bobo/content/posts')
    const publicListBody = (await publicListResponse.json()) as ApiResponse<unknown>

    expect(publicListResponse.status).toBe(200)
    const publicListData = expectOkData(publicListBody)
    const parsedPublicList = PublicPostListResponseSchema.parse(publicListData)
    expect(parsedPublicList.posts).toHaveLength(1)
    expect(parsedPublicList.posts[0]).not.toHaveProperty('status')

    const publicResponse = await momoApp.request('/rpc/bobo/content/posts/hello-content')
    const publicBody = (await publicResponse.json()) as ApiResponse<unknown>

    expect(publicResponse.status).toBe(200)
    const publicData = expectOkData(publicBody)
    const parsedPublicData = PublicPostResponseSchema.parse(publicData)
    expect(parsedPublicData.post.source).toBe('# Hello draft')
    expect(parsedPublicData.post).not.toHaveProperty('draftRevisionId')
    expect(parsedPublicData.post).not.toHaveProperty('publishedRevisionId')
  })

  it('个人站公开接口可以读取文章、分类和标签', async () => {
    const categoryResponse = await momoApp.request('/rpc/content/categories', {
      body: JSON.stringify({
        description: '分类说明',
        name: '随笔',
        slug: 'notes',
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'POST',
    })
    const category = expectOkData((await categoryResponse.json()) as ApiResponse<{ category: { id: string } }>).category

    const tagResponse = await momoApp.request('/rpc/content/tags', {
      body: JSON.stringify({
        name: 'TypeScript',
        slug: 'typescript',
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'POST',
    })
    const tag = expectOkData((await tagResponse.json()) as ApiResponse<{ tag: { id: string } }>).tag

    const created = await createPost({
      categoryId: category.id,
      slug: 'public-filtered-post',
      source: '# Public filtered post',
      tagIds: [tag.id],
      title: 'Public Filtered Post',
    })
    const postId = expectOkData(created.body).post.id

    const publishResponse = await momoApp.request(`/rpc/content/posts/${postId}/publish`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    expect(publishResponse.status).toBe(200)

    const listResponse = await momoApp.request('/rpc/bobo/content/posts?categorySlug=notes&tagSlug=typescript')
    const listData = expectOkData((await listResponse.json()) as ApiResponse<unknown>)
    const parsedList = PublicPostListResponseSchema.parse(listData)

    expect(parsedList.posts.map((post) => post.slug)).toEqual(['public-filtered-post'])
    expect(parsedList.posts[0].category?.slug).toBe('notes')
    expect(parsedList.posts[0].tags.map((item) => item.slug)).toEqual(['typescript'])

    const categoriesResponse = await momoApp.request('/rpc/bobo/content/categories')
    const categoriesData = expectOkData((await categoriesResponse.json()) as ApiResponse<unknown>)
    const categories = PublicCategoryListResponseSchema.parse(categoriesData)
    expect(categories.categories.some((item) => item.slug === 'notes')).toBe(true)
    expect(categories.categories.find((item) => item.slug === 'notes')?.postCount).toBe(1)

    const tagsResponse = await momoApp.request('/rpc/bobo/content/tags')
    const tagsData = expectOkData((await tagsResponse.json()) as ApiResponse<unknown>)
    const tags = PublicTagListResponseSchema.parse(tagsData)
    expect(tags.tags.some((item) => item.slug === 'typescript')).toBe(true)
  })

  it('归档文章副作用失败时响应带 warnings', async () => {
    const created = await createPost({
      slug: 'archive-warning-post',
      source: '# Archive warning post',
      title: 'Archive Warning Post',
    })
    const postId = expectOkData(created.body).post.id

    const publishResponse = await momoApp.request(`/rpc/content/posts/${postId}/publish`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    expect(publishResponse.status).toBe(200)

    const archiveResponse = await momoApp.request(`/rpc/content/posts/${postId}/archive`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    const archiveBody = (await archiveResponse.json()) as ApiResponse<PostDetailResponse>

    expect(archiveResponse.status).toBe(200)
    const archiveData = expectOkData(archiveBody)
    PostDetailResponseSchema.parse(archiveData)
    expect(archiveData.post.status).toBe('archived')
    expect(archiveData.warnings?.[0]?.code).toBe('content.post.archive.side_effect_failed')
  })

  it('创建文章带标签时返回文章包含标签', async () => {
    const tag = await createTag('TypeScript', 'typescript-create')

    const created = await createPost({
      slug: 'post-with-tags',
      source: '# Post with tags',
      tagIds: [tag.id],
      title: 'Post With Tags',
    })

    expect(created.status).toBe(201)
    const data = expectOkData(created.body)
    expect(data.post.draft.tags.map((item) => item.id)).toEqual([tag.id])
  })

  it('保存草稿时 tagIds 保留 undefined、空数组和替换语义', async () => {
    const firstTag = await createTag('First', 'first-tag')
    const secondTag = await createTag('Second', 'second-tag')
    const created = await createPost({
      slug: 'draft-tag-semantics',
      source: '# Draft tag semantics',
      tagIds: [firstTag.id],
      title: 'Draft Tag Semantics',
    })
    const postId = expectOkData(created.body).post.id

    const keepResponse = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({ draft: { source: '# Keep tags' } }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const keepData = expectOkData((await keepResponse.json()) as ApiResponse<PostDetailResponse>)
    expect(keepData.post.draft.tags.map((item) => item.id)).toEqual([firstTag.id])

    const clearResponse = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({ draft: { source: '# Clear tags', tagIds: [] } }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const clearData = expectOkData((await clearResponse.json()) as ApiResponse<PostDetailResponse>)
    expect(clearData.post.draft.tags).toEqual([])

    const replaceResponse = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({ draft: { source: '# Replace tags', tagIds: [secondTag.id] } }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const replaceData = expectOkData((await replaceResponse.json()) as ApiResponse<PostDetailResponse>)
    expect(replaceData.post.draft.tags.map((item) => item.id)).toEqual([secondTag.id])
  })

  it('创建文章传不存在的 tag id 时不会写入文章和 revision', async () => {
    const beforeRevisions = await getDb().select().from(contentPostRevisions)

    const response = await createPost({
      slug: 'missing-tag-post',
      source: '# Missing tag',
      tagIds: ['missing-tag'],
      title: 'Missing Tag',
    })
    const postRows = await getDb().select().from(contentPosts).where(eq(contentPosts.draftSlug, 'missing-tag-post'))
    const afterRevisions = await getDb().select().from(contentPostRevisions)

    expect(response.status).toBe(404)
    expect(response.body.ok).toBe(false)
    expect(!response.body.ok && response.body.error.code).toBe(BizCode.COMMON_NOT_FOUND)
    expect(postRows).toEqual([])
    expect(afterRevisions).toHaveLength(beforeRevisions.length)
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
        draft: {
          coverAssetId: null,
          excerpt: null,
          source: '# Cleared',
        },
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<PostDetailResponse>

    expect(response.status).toBe(200)
    const data = expectOkData(body)
    PostDetailResponseSchema.parse(data)
    expect(data.post.draft.coverAssetId).toBeNull()
    expect(data.post.draft.excerpt).toBeNull()
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
        draft: {
          coverAssetId: 'missing-asset',
        },
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
      .where(eq(contentPreviewTokens.targetId, postId))

    const response = await momoApp.request(`/rpc/previews/${tokenBody.ok ? tokenBody.data.token : ''}`)
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED)
  })

  it('旧内容素材和旧内容预览读取路径不存在', async () => {
    const assetResponse = await momoApp.request('/rpc/content/assets', {
      headers: { cookie: ownerCookie },
    })
    const uploadResponse = await momoApp.request('/rpc/content/assets/images', {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    const previewResponse = await momoApp.request('/rpc/content/previews/token-1')

    expect(assetResponse.status).toBe(404)
    expect(uploadResponse.status).toBe(404)
    expect(previewResponse.status).toBe(404)
  })

  it('素材可以列表、读取详情、读取文件、更新说明和删除', async () => {
    const firstAsset = await uploadImage('first.png')
    const secondAsset = await uploadImage('second.png')
    const firstAssetData = expectOkData(firstAsset.body)
    const secondAssetData = expectOkData(secondAsset.body)

    const listResponse = await momoApp.request('/rpc/assets?page=1&pageSize=10', {
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

    const detailResponse = await momoApp.request(`/rpc/assets/${firstAssetData.asset.id}`, {
      headers: {
        cookie: ownerCookie,
      },
    })
    const detailBody = (await detailResponse.json()) as ApiResponse<unknown>

    expect(detailResponse.status).toBe(200)
    const detailData = expectOkData(detailBody)
    AssetDetailResponseSchema.parse(detailData)
    expect((detailData as { asset: { id: string } }).asset.id).toBe(firstAssetData.asset.id)

    const fileResponse = await momoApp.request(`/rpc/assets/${firstAssetData.asset.id}/file`)
    expect(fileResponse.status).toBe(200)
    expect(fileResponse.headers.get('content-type')).toBe('image/png')
    expect(fileResponse.headers.get('cross-origin-resource-policy')).toBe('cross-origin')

    const updateResponse = await momoApp.request(`/rpc/assets/${firstAssetData.asset.id}`, {
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

    const rejectDeleteResponse = await momoApp.request(`/rpc/assets/${firstAssetData.asset.id}`, {
      headers: {
        cookie: ownerCookie,
      },
      method: 'DELETE',
    })
    const rejectDeleteBody = (await rejectDeleteResponse.json()) as ApiResponse<never>

    expect(rejectDeleteResponse.status).toBe(409)
    expect(rejectDeleteBody.ok).toBe(false)
    expect(!rejectDeleteBody.ok && rejectDeleteBody.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)

    const deleteResponse = await momoApp.request(`/rpc/assets/${secondAssetData.asset.id}`, {
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

    const afterDeleteResponse = await momoApp.request(`/rpc/assets/${secondAssetData.asset.id}`, {
      headers: { cookie: ownerCookie },
    })
    expect(afterDeleteResponse.status).toBe(404)
  })

  it('未登录请求素材接口被拒绝', async () => {
    const response = await momoApp.request('/rpc/assets')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 fifa owner 请求素材接口被拒绝', async () => {
    const user = await createCredentialUser({ email: 'asset-normal@example.com', name: 'Normal User' })
    const cookie = await signInByEmail(momoApp, user.email)

    const response = await momoApp.request('/rpc/assets', { headers: { cookie } })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('素材被草稿正文引用时不能删除', async () => {
    const uploaded = await uploadImage('referenced.png')
    const assetData = expectOkData(uploaded.body)
    const assetUrl = assetData.asset.fileUrl

    await createPost({
      slug: 'url-in-draft',
      source: `<Figure src="${assetUrl}" alt="test" />`,
      title: 'URL In Draft',
    })

    const response = await momoApp.request(`/rpc/assets/${assetData.asset.id}`, {
      headers: { cookie: ownerCookie },
      method: 'DELETE',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(409)
    expect(!body.ok && body.error.code).toBe(BizCode.BIZ_RULE_VIOLATION)
  })

  it('素材被发布封面或项目封面引用时不能删除', async () => {
    const postPublishedCover = expectOkData((await uploadImage('post-published-cover.png')).body).asset
    const projectDraftCover = expectOkData((await uploadImage('project-draft-cover.png')).body).asset
    const projectPublishedCover = expectOkData((await uploadImage('project-published-cover.png')).body).asset

    const post = await createPost({
      coverAssetId: postPublishedCover.id,
      slug: 'published-cover-post',
      source: '# Published Cover Post',
      title: 'Published Cover Post',
    })
    const postId = expectOkData(post.body).post.id

    const publishPostResponse = await momoApp.request(`/rpc/content/posts/${postId}/publish`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    expect(publishPostResponse.status).toBe(200)

    const project = await createProject({
      coverAssetId: projectDraftCover.id,
      slug: 'cover-project',
      title: 'Cover Project',
    })
    const projectId = project.id

    const draftCoverDetailResponse = await momoApp.request(`/rpc/assets/${projectDraftCover.id}`, {
      headers: { cookie: ownerCookie },
    })
    const draftCoverDetail = AssetDetailResponseSchema.parse(
      expectOkData((await draftCoverDetailResponse.json()) as ApiResponse<unknown>),
    )
    expect(draftCoverDetail.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relation: 'draft-cover',
          targetId: projectId,
          targetType: 'project',
        }),
      ]),
    )

    const saveProjectDraftResponse = await momoApp.request(`/rpc/projects/${projectId}/draft`, {
      body: JSON.stringify({
        draft: {
          coverAssetId: projectPublishedCover.id,
        },
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    expect(saveProjectDraftResponse.status).toBe(200)

    const publishProjectResponse = await momoApp.request(`/rpc/projects/${projectId}/publish`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    expect(publishProjectResponse.status).toBe(200)

    const publishedCoverDetailResponse = await momoApp.request(`/rpc/assets/${projectPublishedCover.id}`, {
      headers: { cookie: ownerCookie },
    })
    const publishedCoverDetail = AssetDetailResponseSchema.parse(
      expectOkData((await publishedCoverDetailResponse.json()) as ApiResponse<unknown>),
    )
    expect(publishedCoverDetail.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relation: 'published-cover',
          targetId: projectId,
          targetType: 'project',
        }),
      ]),
    )

    const rejectPostCoverDelete = await momoApp.request(`/rpc/assets/${postPublishedCover.id}`, {
      headers: { cookie: ownerCookie },
      method: 'DELETE',
    })
    const rejectProjectCoverDelete = await momoApp.request(`/rpc/assets/${projectPublishedCover.id}`, {
      headers: { cookie: ownerCookie },
      method: 'DELETE',
    })

    expect(rejectPostCoverDelete.status).toBe(409)
    expect(rejectProjectCoverDelete.status).toBe(409)
  })

  it('上传图片会保存素材记录', async () => {
    const result = await uploadImage('photo.png')

    expect(result.status).toBe(201)
    const data = expectOkData(result.body)
    ImageAssetResponseSchema.parse(data)
    expect(data.asset.mimeType).toBe('image/png')
    expect(data.asset.size).toBe(8)
    expect(data.asset.fileUrl).toBe(`http://localhost:7788/rpc/assets/${data.asset.id}/file`)
    expect(data.asset.url).toBeNull()
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

  it('已发布文章保存草稿不会提前改公开 slug 和标题', async () => {
    const created = await createPost({
      excerpt: '公开摘要',
      slug: 'published-slug',
      source: '# Published',
      title: 'Published Title',
    })
    const postId = expectOkData(created.body).post.id

    const firstPublishResponse = await momoApp.request(`/rpc/content/posts/${postId}/publish`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    expect(firstPublishResponse.status).toBe(200)

    const draftResponse = await momoApp.request(`/rpc/content/posts/${postId}/draft`, {
      body: JSON.stringify({
        draft: {
          excerpt: '草稿摘要',
          slug: 'draft-slug',
          source: '# Draft',
          title: 'Draft Title',
        },
      }),
      headers: jsonHeaders(ownerCookie),
      method: 'PATCH',
    })
    expect(draftResponse.status).toBe(200)

    const oldPublicResponse = await momoApp.request('/rpc/bobo/content/posts/published-slug')
    const oldPublicData = expectOkData((await oldPublicResponse.json()) as ApiResponse<unknown>)
    const oldPublicPost = PublicPostResponseSchema.parse(oldPublicData).post
    expect(oldPublicPost.title).toBe('Published Title')
    expect(oldPublicPost.excerpt).toBe('公开摘要')
    expect(oldPublicPost.source).toBe('# Published')

    const newPublicResponseBeforePublish = await momoApp.request('/rpc/bobo/content/posts/draft-slug')
    expect(newPublicResponseBeforePublish.status).toBe(404)

    const secondPublishResponse = await momoApp.request(`/rpc/content/posts/${postId}/publish`, {
      headers: { cookie: ownerCookie },
      method: 'POST',
    })
    expect(secondPublishResponse.status).toBe(200)

    const newPublicResponse = await momoApp.request('/rpc/bobo/content/posts/draft-slug')
    const newPublicData = expectOkData((await newPublicResponse.json()) as ApiResponse<unknown>)
    const newPublicPost = PublicPostResponseSchema.parse(newPublicData).post
    expect(newPublicPost.title).toBe('Draft Title')
    expect(newPublicPost.excerpt).toBe('草稿摘要')
    expect(newPublicPost.source).toBe('# Draft')
  })
})

async function createPost(input: CreatePostRequest['draft']) {
  const response = await momoApp.request('/rpc/content/posts', {
    body: JSON.stringify({ draft: input }),
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

  const response = await momoApp.request('/rpc/assets/images', {
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

async function createProject(input: { coverAssetId?: string | null; slug: string; title: string }) {
  const response = await momoApp.request('/rpc/projects', {
    body: JSON.stringify({
      draft: input,
    }),
    headers: jsonHeaders(ownerCookie),
    method: 'POST',
  })
  const body = (await response.json()) as ApiResponse<{ project: { id: string } }>

  expect(response.status).toBe(201)
  return expectOkData(body).project
}

async function createTag(name: string, slug: string): Promise<{ id: string }> {
  const response = await momoApp.request('/rpc/content/tags', {
    body: JSON.stringify({ name, slug }),
    headers: jsonHeaders(ownerCookie),
    method: 'POST',
  })
  const body = (await response.json()) as ApiResponse<{ tag: { id: string } }>

  expect(response.status).toBe(201)
  return expectOkData(body).tag
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

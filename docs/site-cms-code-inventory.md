# Site CMS 代码现状

这份文档记录 Site CMS 当前代码放在哪里、接口怎么走、数据库字段以哪里为准。旧 content 素材路径、旧文章预览路径和旧文章顶层字段已经不再保留。

## 模块边界

- `apps/momo/src/modules/content`
  只处理文章、分类、标签、文章草稿、文章发布和文章归档。
- `apps/momo/src/modules/assets`
  处理图片素材上传、列表、详情、文件读取、更新和删除。
- `apps/momo/src/modules/preview`
  处理通用预览读取。它读取 `content_preview_tokens`，按 `targetType` 返回文章或项目预览数据。
- `apps/momo/src/modules/projects`
  处理项目后台草稿、发布、归档和公开项目读取。
- `apps/momo/src/modules/profile`
  处理后台用户资料和 Bobo 公开资料。
- `apps/momo/src/modules/site`
  处理 Bobo 站点导航、首页区块和 SEO 配置。
- `apps/momo/src/modules/events`
  处理发布和归档后的 Bobo cache 刷新、搜索索引写入或删除。

## Momo 接口

文章后台接口：

```text
GET /rpc/content/posts
POST /rpc/content/posts
POST /rpc/content/posts/meta-suggestion
GET /rpc/content/posts/:id
PATCH /rpc/content/posts/:id/draft
POST /rpc/content/posts/:id/preview-token
POST /rpc/content/posts/:id/publish
POST /rpc/content/posts/:id/archive
GET /rpc/content/mdx-components
GET /rpc/content/categories
POST /rpc/content/categories
GET /rpc/content/categories/:id
PATCH /rpc/content/categories/:id
DELETE /rpc/content/categories/:id
GET /rpc/content/tags
POST /rpc/content/tags
GET /rpc/content/tags/:id
PATCH /rpc/content/tags/:id
DELETE /rpc/content/tags/:id
```

素材接口：

```text
GET /rpc/assets
POST /rpc/assets/images
GET /rpc/assets/:id
PATCH /rpc/assets/:id
DELETE /rpc/assets/:id
GET /rpc/assets/:id/file
```

预览读取接口：

```text
GET /rpc/previews/:token
```

公开内容接口：

```text
GET /rpc/bobo/content/posts
GET /rpc/bobo/content/posts/:slug
GET /rpc/bobo/content/categories
GET /rpc/bobo/content/tags
GET /rpc/bobo/projects
GET /rpc/bobo/projects/:slug
GET /rpc/bobo/profile
GET /rpc/bobo/site
GET /rpc/bobo/search
```

不存在的旧路径：

```text
/rpc/content/assets/*
/rpc/content/previews/:token
```

## 数据库表

素材表是 `assets`。

文章主表是 `content_posts`。当前只保留草稿字段、发布字段、状态字段、时间字段和人员字段：

- `draft_slug`
- `published_slug`
- `draft_title`
- `published_title`
- `draft_excerpt`
- `published_excerpt`
- `draft_category_id`
- `published_category_id`
- `draft_cover_asset_id`
- `published_cover_asset_id`
- `draft_revision_id`
- `published_revision_id`

文章标签关系分开保存：

- `content_post_draft_tags`
- `content_post_published_tags`

文章正文源码保存在 `content_post_revisions.source`。后台保存草稿会新增 revision，并更新 `draft_revision_id`。发布时把当前草稿字段复制到 `published_*` 字段，并把草稿标签复制到发布标签关系表。

预览 token 表是 `content_preview_tokens`。它只保存：

- `target_type`
- `target_id`
- `token_hash`
- `expires_at`
- `used_at`
- 创建人和创建时间

## Contract 形状

后台文章响应使用：

```ts
post.draft
post.published
```

创建文章和保存草稿请求体使用：

```ts
{
  draft: {
    slug: string
    title: string
    source: string
    excerpt?: string | null
    coverAssetId?: string | null
    categoryId?: string | null
    tagIds?: string[]
  }
}
```

公开文章响应继续返回 `slug`、`title`、`excerpt`、`coverAssetId`、`category`、`tags` 和 `source`。这些字段只来自 `published_*` 字段和发布关系表。

后台项目响应也使用：

```ts
project.draft
project.published
```

公开项目响应继续返回公开页面需要的扁平字段。

预览 token 响应只返回：

```ts
targetType
targetId
token
expiresAt
```

## Fifa 和 Bobo 调用

Fifa 素材接口只调用 `/rpc/assets/*`。

Fifa 文章编辑页读取和保存 `post.draft`。发布后显示 `post.published` 里的发布时间、slug 和标题等公开状态。

Fifa 预览 URL 统一通过 `buildBoboPreviewUrl(targetType, targetId, token)` 生成：

```text
/preview/post/:id?token=...
/preview/project/:id?token=...
```

Bobo 只保留通用预览页：

```text
apps/bobo/app/(preview)/preview/[targetType]/[targetId]/page.tsx
```

Bobo 预览读取只调用：

```text
GET /rpc/previews/:token
```

## 发布、归档和副作用

文章和项目发布会写 `event_outbox`。Momo 随后刷新 Bobo cache，并写入搜索索引。

文章和项目归档也会写 `event_outbox`。Momo 随后刷新 Bobo cache，并删除搜索索引里的文档。

cache 刷新或搜索索引处理失败时，事件会被标记为 `failed`，错误信息写入 `event_outbox.error_message`。接口响应会带 `warnings`，不会静默吞掉错误。

## 测试入口

Momo：

```bash
pnpm --filter @xdd-zone/momo type-check
pnpm --filter @xdd-zone/momo test
```

Fifa：

```bash
pnpm --filter @xdd-zone/fifa type-check
pnpm --filter @xdd-zone/fifa test
```

Bobo：

```bash
pnpm --filter @xdd-zone/bobo type-check
pnpm --filter @xdd-zone/bobo test
```

构建：

```bash
pnpm build:momo
pnpm build:fifa
pnpm build:bobo
```

# Site CMS 代码盘点和改造清单

> 当前工作树已按这份清单完成一轮实现。`assets`、`site`、`profile`、`projects`、`search`、`events` 和 `preview` 已拆成独立模块；文章已区分 draft/published 展示字段；发布会写 outbox、刷新 Bobo cache，并写入搜索索引；文章和项目归档会从公开站点和搜索索引移除。下面的盘点保留最初拆解问题时的结构，接口现状以 `docs/topics/api.md` 和各 app 指南为准。

这份文档按个人站内容管理系统的方向检查当前代码。它只写当前代码状态和后续改造清单，不写已经不存在或还没开始的实现细节。

## 当前结论

当前代码已经跑通了文稿管理的主流程：Fifa 管文章和素材，Momo 保存文章草稿、版本、预览 token 和发布状态，Bobo 读取公开文章并渲染列表、详情和预览页。

和新的系统设计相比，最需要改的是这些地方：

- `content` 现在同时管文章、分类、标签、预览和素材。后续素材要迁到独立 `assets` 模块。
- `profile` 现在是 Fifa owner 的后台资料，不是 Bobo 公开个人资料。后续要区分后台账号资料和公开个人资料。
- 文章已经有 revision 表，但 `slug`、`title`、`excerpt`、`coverAssetId` 仍然直接存在 `content_posts` 主表。草稿保存会立刻改这些字段。新设计希望公开字段和草稿字段分开。
- 预览 token 现在只支持文章，表里只有 `postId` 和 `revisionId`。后续要改成 `targetType`、`targetId` 这类通用目标。
- Bobo 公开请求已经开始使用 `revalidate: 60` 和 `next.tags`。当前工作树里已有 `apps/bobo/app/api/revalidate/route.ts` 和测试，但 Momo 发布后还没有调用这个接口。
- 搜索驱动已经有，但业务模块还没有写搜索接口和索引写入。
- 发布后任务还没有内部事件和 outbox。现在 `publishPost()` 只改数据库状态。
- `packages/contracts/src/content` 里同时放文章、公开文章、分类、标签和素材类型。后续要拆出 `assets`、`site`、`projects` 等模块。

当前不建议马上大拆。先补发布后任务、公开缓存刷新和 contracts 边界，再迁 assets 和通用 preview。

## 已经符合新设计的地方

### Momo 路由分开

相关文件：

```text
apps/momo/src/modules/content/content.route.ts
apps/momo/src/modules/content/public-content.route.ts
apps/momo/src/routes/index.ts
```

当前状态：

- Fifa 管理接口在 `/rpc/content/*`。
- Bobo 公开接口在 `/rpc/bobo/content/*`。
- 公开接口不检查登录态，只返回已发布文章、分类和标签。
- 管理接口走 `createRequirePermission()`，当前最终检查 `fifa.owner`。

这符合“管理接口和公开接口分开”的方向。后续新增 `site`、`projects`、`assets` 时继续沿用这个写法。

### Bobo 页面走 lib 读取 Momo

相关文件：

```text
apps/bobo/lib/http.ts
apps/bobo/lib/api/post.api.ts
apps/bobo/lib/api/category.api.ts
apps/bobo/lib/api/tag.api.ts
apps/bobo/lib/content/public-content.ts
apps/bobo/lib/content/preview-post.ts
apps/bobo/app/(site)/writing/page.tsx
apps/bobo/app/(site)/writing/[slug]/page.tsx
apps/bobo/app/(preview)/preview/posts/[postId]/page.tsx
```

当前状态：

- 页面没有直接拼 Momo URL。
- `lib/api/*.api.ts` 负责请求 Momo。
- `lib/content/*.ts` 负责解析 contracts schema 和处理错误。
- 文章详情不存在时走 Next `notFound()`。
- 预览页 `dynamic = 'force-dynamic'`，`revalidate = 0`，请求 Momo 时使用 `cache: 'no-store'`。

这符合“Bobo 页面调用领域读取函数”的方向。

### Fifa API/query 和页面分层清楚

相关文件：

```text
apps/fifa/src/api/content/posts.api.ts
apps/fifa/src/api/content/content.query.ts
apps/fifa/src/features/content/pages/PostList.tsx
apps/fifa/src/features/content/pages/PostEdit.tsx
apps/fifa/src/features/content/pages/AssetList.tsx
```

当前状态：

- `posts.api.ts` 封装 Momo RPC 调用。
- `content.query.ts` 封装 query key 和 hooks。
- 页面调用 hooks，不直接 import `momoClient`。
- 文章编辑页会先保存草稿，再生成预览 token。
- 发布时如果页面有未保存内容，会先保存草稿，再调用发布接口。

这符合“页面按管理工作写，API 按 Momo 模块写”的方向。

### 存储和搜索驱动已经有入口

相关文件：

```text
apps/momo/src/bootstrap/create-runtime.ts
apps/momo/src/infra/storage/storage.types.ts
apps/momo/src/infra/storage/local-storage.ts
apps/momo/src/infra/storage/cos-storage.ts
apps/momo/src/infra/search/search.types.ts
apps/momo/src/infra/search/disabled-search.ts
apps/momo/src/infra/search/meilisearch-search.ts
```

当前状态：

- `MomoRuntime` 已经包含 `storage` 和 `search`。
- 文件存储支持 local 和 COS。
- 搜索支持 none 和 Meilisearch。
- 搜索驱动还没有业务接口调用。

这符合后续做 `assets` 和 `site/search` 的基础要求。

### 测试基础已经在

相关文件：

```text
apps/momo/src/test/modules/content/content.route.test.ts
apps/momo/src/test/modules/content/content.service.test.ts
apps/bobo/app/api/revalidate/route.test.ts
apps/bobo/lib/api/post.api.test.ts
apps/bobo/lib/content/preview-post.test.ts
apps/bobo/app/(site)/writing/[slug]/page.test.tsx
apps/bobo/app/(preview)/preview/posts/[postId]/page.test.tsx
apps/fifa/src/test/api/content/posts.api.test.ts
```

当前状态：

- Momo content 测试覆盖创建、草稿、预览、发布和公开读取。
- Momo service 测试覆盖素材引用不能删除和存储 URL。
- Bobo 测试覆盖预览 token、文章不存在、Momo 不可用、返回格式错误、公开文章请求缓存 tag 和 revalidate 接口。
- Fifa 有 content API 封装测试。

后续改造可以继续按这些测试位置补，不需要新建另一套测试目录。

## 需要改造的地方

### 1. content 里混着 assets

当前文件：

```text
apps/momo/src/modules/content/content.route.ts
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/momo/src/infra/db/schema/content.schema.ts
packages/contracts/src/content/content.contract.ts
apps/fifa/src/api/content/posts.api.ts
apps/fifa/src/api/content/content.query.ts
apps/fifa/src/features/content/pages/AssetList.tsx
```

当前现状：

- 素材表叫 `content_assets`。
- 素材接口是 `/rpc/content/assets`、`/rpc/content/assets/images`、`/rpc/content/assets/:id/file`。
- `ContentRepository` 同时处理文章和素材。
- `ContentService` 同时处理文章、预览、素材上传和素材删除。
- Fifa 素材页在 `features/content/pages/AssetList.tsx`。

问题：

- 新设计里 `assets` 是站点运营资源，不属于文稿模块。
- 后续 profile、projects、home 都会引用素材。如果继续放在 content 下，`content` 会变成杂物模块。

建议改造：

- 第一阶段保留现有接口，不立刻改路径。
- 新增 `apps/momo/src/modules/assets`，先迁 service、repository、presenter 和 contracts。
- 数据表可以先继续用 `content_assets`，等迁移稳定后再决定是否改表名。表名改动需要 migration，风险更高。
- Fifa API 新增 `apps/fifa/src/api/assets`，页面路径可以先保留 `/content/assets`，后续再移动菜单。
- 公开文件读取路径短期保留 `/rpc/content/assets/:id/file`，避免文章正文里的图片 URL 全部失效。新接口可兼容跳转或复用同一 service。

### 2. profile 现在只是后台 owner 资料

当前文件：

```text
apps/momo/src/modules/profile/profile.route.ts
apps/momo/src/modules/profile/profile.service.ts
apps/momo/src/modules/profile/profile.repository.ts
packages/contracts/src/profile/profile.contract.ts
apps/fifa/src/api/profile/profile.api.ts
apps/fifa/src/features/settings/pages/ProfileSettings.tsx
```

当前现状：

- `/rpc/fifa/profile` 返回 Fifa owner 的后台资料和账号绑定状态。
- 头像上传走 `/rpc/fifa/profile/avatar`。
- 头像文件不写 `content_assets`。
- contracts 类型以 `FifaProfile*` 命名。

问题：

- 新设计里的 `profile` 还要支持 Bobo 公开个人资料，比如简介、社交链接、公开头像、联系方式展示配置。
- 现有 `profile` 模块更像后台账号资料，不适合直接扩展成公开个人资料。

建议改造：

- 保留现有 Fifa owner profile，先不要改名。
- 新增公开个人资料模型时，明确命名为 `siteProfile`、`publicProfile` 或在 `profile` 模块里分 `fifa` 和 `bobo` DTO。
- 公开资料接口走 `/rpc/bobo/profile` 或 `/rpc/bobo/site/profile`。
- 公开资料的头像建议引用 `assets`，不要继续使用 Fifa avatar 文件接口。

### 3. 文章 slug 还是实体级字段

当前文件：

```text
apps/momo/src/infra/db/schema/content.schema.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/momo/src/modules/content/services/content.service.ts
packages/contracts/src/content/content.contract.ts
apps/fifa/src/features/content/pages/PostEdit.tsx
apps/bobo/app/(site)/writing/[slug]/page.tsx
```

当前现状：

- `content_posts.slug` 是唯一字段。
- `saveDraft()` 会更新 `content_posts.slug`。
- Bobo 按 slug 读取公开文章。
- 如果已发布文章在 Fifa 改 slug 并保存草稿，公开 URL 会立即受到影响。

问题：

- 新设计希望 `draftSlug` 和 `publishedSlug` 分开，发布时才改变公开 URL。
- 当前实现会让草稿保存影响公开路径。

建议改造：

- 给文章新增 `draftSlug` 和 `publishedSlug`，或把 slug 放进 draft/published revision 快照。
- Bobo 公开接口只查 `publishedSlug`。
- Fifa 编辑页显示和保存 `draftSlug`。
- 发布时把 `draftSlug` 写入 `publishedSlug`。
- 旧的 `slug` 可以作为迁移过渡字段，迁移完成后再删除。
- 第一版可以不做 redirect 表，等 SEO 需要时再加 `post_slug_redirects`。

### 4. title/excerpt/coverAssetId 也会被草稿保存提前影响

当前文件：

```text
apps/momo/src/infra/db/schema/content.schema.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/momo/src/modules/content/public-content.presenter.ts
```

当前现状：

- `content_posts.title`、`excerpt`、`coverAssetId` 会在保存草稿时直接更新。
- 公开列表和详情从 `content_posts` 读取这些字段。
- 正文 `source` 是通过 `publishedRevisionId` 读取发布版本。

问题：

- 公开正文不会提前变，但标题、摘要、封面和 slug 可能提前变。
- 这和“Bobo 只读 published 快照”不完全一致。

建议改造：

- 建立 draft/published 快照规则。
- 短期可以先把 `title`、`excerpt`、`coverAssetId` 和 `slug` 分成 draft/published 字段。
- 中期可以把展示字段放进 revision 或 snapshot，但 `publishedSlug`、`status`、`publishedAt` 继续保留独立列。
- Momo public presenter 只读 published 字段。

### 5. preview token 只支持文章

当前文件：

```text
apps/momo/src/infra/db/schema/content.schema.ts
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/bobo/app/(preview)/preview/posts/[postId]/page.tsx
apps/bobo/lib/content/preview-post.ts
apps/fifa/src/features/content/utils/preview-url.ts
```

当前现状：

- `content_preview_tokens` 有 `postId` 和 `revisionId`。
- Momo 接口是 `/rpc/content/previews/:token`。
- Bobo 预览页面路径是 `/preview/posts/[postId]?token=...`。

问题：

- 后续项目、首页配置、个性化页面也可能需要预览。
- 当前 token 结构和接口都写死到文章。

建议改造：

- 新增通用 preview 模块或至少新增通用表字段：`targetType`、`targetId`、`revisionId` 或 `snapshotId`、`expiresAt`。
- 保留文章预览接口做兼容，内部调用通用 preview service。
- Bobo 新增按类型分发的预览页面，或者保留 `/preview/posts` 并为其他类型新建路径。
- Fifa 每个管理页面自己生成对应类型的预览 URL。

### 6. 发布后没有刷新 Bobo 缓存

当前文件：

```text
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/bobo/lib/api/post.api.ts
apps/bobo/lib/api/category.api.ts
apps/bobo/lib/api/tag.api.ts
apps/bobo/app/api/revalidate/route.ts
```

当前现状：

- Bobo 公开请求使用 `next: { revalidate: 60 }`，当前工作树已经给文章、分类和标签请求加了 `next.tags`。
- Momo 发布文章后只更新 `content_posts.status`、`publishedAt`、`publishedRevisionId`。
- Momo 没有调用 Bobo revalidate endpoint。
- 当前工作树已有 Bobo revalidate route handler，接口路径是 `POST /api/revalidate`。

问题：

- 发布后最多要等 60 秒，公开页面才会读取新数据。
- 未来首页、RSS、sitemap、搜索页都需要更明确的刷新规则。

建议改造：

- Momo 增加 Bobo 站点刷新 client。
- 发布文章后先同步调用刷新，失败时发布仍然成功，但返回 warning。
- 稳定后改成 outbox job 异步重试。
- Bobo revalidate 接口继续按 `post:<slug>`、`posts:list`、`site:nav` 这类 tag 刷新。

## 测试补充位置

这些位置按改造阶段补，先补离当前代码最近的测试，不另起一套目录。

- revalidate：Bobo 入口放在 `apps/bobo/app/api/revalidate/route.test.ts`，Momo 调用客户端建议放在 `apps/momo/src/test/infra/bobo-revalidate-client.test.ts`，发布失败但文章仍发布的行为放在 `apps/momo/src/test/modules/content/content.service.test.ts` 或 `content.route.test.ts`。
- outbox：先放 `apps/momo/src/test/modules/events` 或 `apps/momo/src/test/modules/jobs`。repository 测事务写入，service 测 pending、retry、failed 状态。
- draft-published：先补 `apps/momo/src/test/modules/content/content.route.test.ts`。重点测已发布文章保存草稿后，公开 slug、标题、摘要和封面仍读旧发布值。
- assets：迁模块前继续补 `apps/momo/src/test/modules/content/content.route.test.ts` 和 `content.service.test.ts`。迁模块后新增 `apps/momo/src/test/modules/assets/assets.route.test.ts`、`assets.service.test.ts`，Fifa API 测试放 `apps/fifa/src/test/api/assets/assets.api.test.ts`。
- site：Momo 测试放 `apps/momo/src/test/modules/site/site.route.test.ts` 和 `site.service.test.ts`。Bobo 读取函数测试放 `apps/bobo/lib/site` 或 `apps/bobo/lib/content` 对应文件旁边。Fifa API 测试放 `apps/fifa/src/test/api/site/site.api.test.ts`。
- projects：Momo 测试放 `apps/momo/src/test/modules/projects/projects.route.test.ts` 和 `projects.service.test.ts`。Bobo 读取函数测试放 `apps/bobo/lib/projects`，Fifa API 测试放 `apps/fifa/src/test/api/projects/projects.api.test.ts`。
- search：已有驱动测试在 `apps/momo/src/test/infra/*search*.test.ts`。业务入口新增后，路由测试放 `apps/momo/src/test/modules/search/search.route.test.ts`，索引写入测试放 `apps/momo/src/test/modules/search/search-indexer.service.test.ts`，Bobo 读取函数测试放 `apps/bobo/lib/search`。

### 7. 发布后任务没有内部事件和 outbox

当前文件：

```text
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/bootstrap/create-runtime.ts
apps/momo/src/infra/db/schema/index.ts
```

当前现状：

- `publishPost()` 直接调用 repository 发布。
- 没有内部事件模块。
- 没有 outbox 表。
- 没有 worker 或重试接口。

问题：

- 后续 revalidate、search indexing、RSS/sitemap 刷新都不应该塞进 `publishPost()`。
- 如果 Momo 发布后进程退出，派生任务可能丢失。

建议改造：

- 第一阶段加内部事件类型和 handler，先保持进程内执行。
- 第二阶段加 `event_outbox` 表，发布事务里写 outbox 记录。
- 新增 job runner 或后台轮询处理 pending outbox。
- Fifa 显示发布结果和任务 warning。
- 提供重试刷新接口。

### 8. 搜索还没有业务入口

当前文件：

```text
apps/momo/src/infra/search/*
apps/momo/src/bootstrap/create-runtime.ts
```

当前现状：

- 搜索驱动已经可以切 none 或 Meilisearch。
- 没有 `/rpc/bobo/search` 或 `/rpc/site/search`。
- 没有索引文档类型。
- 发布文章后不会写搜索索引。

问题：

- 新设计里搜索是站点级能力，不应该只做 `content/posts/search`。

建议改造：

- 新增 `packages/contracts/src/search`。
- 新增 `apps/momo/src/modules/search`。
- 第一版搜索结果只返回文章，但 DTO 带 `type`、`title`、`summary`、`url`、`publishedAt`。
- 发布文章后通过 outbox 更新索引。
- Bobo 后续新增搜索页时只调公开搜索接口。

### 9. contracts 还没有按未来模块拆开

当前文件：

```text
packages/contracts/src/content/content.contract.ts
packages/contracts/src/profile/profile.contract.ts
packages/contracts/src/index.ts
```

当前现状：

- `content.contract.ts` 同时放文章、公开文章、分类、标签、素材、预览。
- `profile.contract.ts` 只服务 Fifa owner profile。
- 没有 `assets`、`site`、`projects`、`search` contract。

问题：

- 随着新模块增加，`content.contract.ts` 会越来越大。
- 素材、站点配置、项目和搜索都不应该塞进 content contract。

建议改造：

- 迁 `ImageAsset*`、`Asset*`、`UpdateAsset*` 到 `packages/contracts/src/assets`。
- 新增 `packages/contracts/src/site`，放站点配置、导航、首页配置 DTO。
- 新增 `packages/contracts/src/projects`，放项目 DTO。
- 新增 `packages/contracts/src/search`，放公开搜索请求和响应 DTO。
- `packages/contracts/src/content` 保留文章、分类、标签、文章预览相关类型。

### 10. Bobo 首页还没有从 Momo 读取站点配置

当前文件：

```text
apps/bobo/app/(site)/page.tsx
apps/bobo/app/(site)/_components/site/site-nav-items.ts
apps/bobo/app/(site)/_lib/placeholder.ts
```

当前现状：

- 首页和导航仍然主要由 Bobo 代码决定。
- 文稿列表和详情已经从 Momo 读数据。
- 站点配置、导航、首页模块开关还没有 Momo 接口。

问题：

- 新设计里导航、首页模块、SEO 默认值和社交链接这类可管理数据应放 Momo。

建议改造：

- 新增 `site` 模块时先支持 `siteKey = "bobo"`。
- 第一版只做导航、首页模块开关和 SEO 默认值。
- Bobo 新增 `getSiteShellData()` 或 `getHomePageData()`。
- 不做通用页面搭建器，不让后台随意配置任意组件树。

### 11. Fifa 菜单目前仍按 content 聚合素材

当前文件：

```text
apps/fifa/src/features/content/routes.tsx
apps/fifa/src/features/content/pages/AssetList.tsx
```

当前现状：

- `/content/assets` 在 content 菜单组下。
- 素材页调用 `useContentAssetsQuery()`。

问题：

- 新设计里素材是独立资源。页面路径可以暂时保留，但 API/query 应该先迁。

建议改造：

- 先迁 API/query 到 `apps/fifa/src/api/assets`。
- 页面仍可放在 content 菜单下，等新增 profile/projects/site 使用素材后，再考虑移动到 `assets` 或 `resources` 菜单组。
- 不要为了目录纯净先搬 UI，先保证业务接口边界正确。

## 改造顺序

### 第一阶段：不拆表，先补发布后的任务入口

目标：不破坏现有文稿流程，先把发布后任务从文章 service 里分出来。

清单：

- [ ] 新增 Momo 内部事件类型，例如 `content.post.published`。
- [ ] `publishPost()` 发布成功后产生事件，但仍返回现有 `PostDetailResponse`。
- [ ] 确认当前工作树里的 Bobo revalidate route handler，并和 Momo 调用方式一起纳入提交。
- [ ] Momo 新增 Bobo revalidate client。
- [ ] 发布文章后刷新 Bobo 文稿详情、文稿列表、分类、标签相关缓存。
- [ ] revalidate 失败时，发布成功，响应里返回 warning。
- [ ] Fifa 发布成功提示支持 warning。
- [ ] 补 Momo route/service 测试：发布成功但刷新失败时不回滚发布。
- [ ] 确认当前工作树里的 Bobo revalidate route 测试覆盖 secret、空 payload、tags 和 paths。

涉及文件：

```text
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/content.route.ts
apps/momo/src/bootstrap/create-runtime.ts
apps/momo/src/shared/env.ts
apps/bobo/app/api/revalidate/route.ts
apps/bobo/lib/env.server.ts
apps/fifa/src/features/content/pages/PostEdit.tsx
packages/contracts/src/content/content.contract.ts
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:bobo
pnpm --filter @xdd-zone/bobo test
pnpm type-check:fifa
cd apps/fifa && pnpm test
```

### 第二阶段：加 outbox，不急着上外部队列

目标：发布和派生任务有可重试记录。

清单：

- [ ] 新增 `event_outbox` 或 `publish_jobs` 表。
- [ ] 发布事务里写 outbox 记录。
- [ ] 新增 outbox repository 和 service。
- [ ] 新增 worker 或管理接口触发 pending job。
- [ ] 记录 job 状态、失败原因、重试次数和最后处理时间。
- [ ] Fifa 提供“重新刷新站点缓存”操作。
- [ ] 补 outbox repository/service 测试。

涉及文件：

```text
apps/momo/src/infra/db/schema/*.schema.ts
apps/momo/src/modules/jobs 或 apps/momo/src/modules/events
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/test/modules/jobs
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm build:momo
```

### 第三阶段：迁 assets 模块

目标：素材不再属于 content。

清单：

- [ ] 新增 `packages/contracts/src/assets`。
- [ ] 新增 `apps/momo/src/modules/assets`。
- [ ] 从 content repository/service 中迁出素材上传、列表、详情、更新、删除、文件读取。
- [ ] 保留旧 `/rpc/content/assets/*` 路径兼容，内部调用 assets service。
- [ ] 新增 `/rpc/assets/*` 或 `/rpc/fifa/assets/*` 管理接口，具体路径改前先统一。
- [ ] Fifa 新增 `apps/fifa/src/api/assets`。
- [ ] `AssetList.tsx` 改用 assets query hooks。
- [ ] content 只通过 assets service 检查 `coverAssetId` 是否存在。
- [ ] 补 Momo assets route/service 测试。
- [ ] 补 Fifa assets API 测试。

涉及文件：

```text
packages/contracts/src/assets
apps/momo/src/modules/assets
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/momo/src/infra/db/schema/content.schema.ts
apps/fifa/src/api/assets
apps/fifa/src/features/content/pages/AssetList.tsx
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:fifa
cd apps/fifa && pnpm test
pnpm build:fifa
```

### 第四阶段：修正文章草稿和公开字段分离

目标：保存草稿不再提前影响 Bobo 公开页面。

清单：

- [ ] 设计 migration：新增 `draftSlug`、`publishedSlug`、`draftTitle`、`publishedTitle`、`draftExcerpt`、`publishedExcerpt`，或新增 draft/published snapshot。
- [ ] Bobo 公开接口改查 published 字段。
- [ ] Fifa 编辑页读写 draft 字段。
- [ ] 发布时把 draft 字段写到 published 字段。
- [ ] slug 冲突检查改成 draft/published 语义。
- [ ] 补测试：已发布文章改草稿 slug 后，旧公开 URL 仍可访问，新 slug 发布后才生效。
- [ ] 补测试：已发布文章改标题草稿后，Bobo 公开列表仍显示旧标题。

涉及文件：

```text
apps/momo/src/infra/db/schema/content.schema.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/content.presenter.ts
apps/momo/src/modules/content/public-content.presenter.ts
packages/contracts/src/content/content.contract.ts
apps/fifa/src/features/content/pages/PostEdit.tsx
apps/bobo/lib/content/public-content.ts
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:bobo
pnpm --filter @xdd-zone/bobo test
pnpm type-check:fifa
cd apps/fifa && pnpm test
```

### 第五阶段：通用 preview

目标：预览 token 支持文章之外的内容。

清单：

- [ ] 新增 preview target 类型：`post`、`project`、`site-page` 等。
- [ ] 改 preview token 表，增加 `targetType`、`targetId`，保留文章兼容字段或做数据迁移。
- [ ] 新增 preview service，文章 preview 调用它。
- [ ] Bobo 预览页按 target type 分发。
- [ ] Fifa 每类内容生成自己的预览 URL。
- [ ] 补测试：post preview 兼容旧路径，新 target type 能返回对应预览数据。

涉及文件：

```text
apps/momo/src/modules/content/services/content.service.ts
apps/momo/src/modules/content/repositories/content.repository.ts
apps/momo/src/infra/db/schema/content.schema.ts
apps/bobo/app/(preview)
apps/bobo/lib/content/preview-post.ts
apps/fifa/src/features/content/utils/preview-url.ts
packages/contracts/src/content/content.contract.ts
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:bobo
pnpm --filter @xdd-zone/bobo test
```

### 第六阶段：新增 site 模块

目标：导航、首页配置、SEO 默认值从 Momo 读取。

清单：

- [ ] 新增 `packages/contracts/src/site`。
- [ ] 新增 `apps/momo/src/modules/site`。
- [ ] 新增 `siteKey = "bobo"` 的配置读取和更新接口。
- [ ] Fifa 新增站点设置页面。
- [ ] Bobo 新增 `getSiteShellData()` 和 `getHomePageData()`。
- [ ] Bobo layout/nav 读取 Momo 公开配置。
- [ ] 发布或保存站点配置后刷新 Bobo 首页、导航、RSS、sitemap。
- [ ] 补 Momo site route/service 测试。
- [ ] 补 Bobo lib 测试。

涉及文件：

```text
packages/contracts/src/site
apps/momo/src/modules/site
apps/momo/src/infra/db/schema/site.schema.ts
apps/fifa/src/api/site
apps/fifa/src/features/site 或 apps/fifa/src/features/settings
apps/bobo/app/(site)/layout.tsx
apps/bobo/app/(site)/page.tsx
apps/bobo/app/(site)/_components/site/site-nav-items.ts
apps/bobo/lib
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:fifa
cd apps/fifa && pnpm test
pnpm type-check:bobo
pnpm --filter @xdd-zone/bobo test
pnpm build:bobo
```

### 第七阶段：新增 projects 模块

目标：项目和作品集作为独立内容类型，不塞进文章。

清单：

- [ ] 新增 `packages/contracts/src/projects`。
- [ ] 新增 `apps/momo/src/modules/projects`。
- [ ] 项目表支持 `status`、`publishedAt`、排序、链接、截图 asset id 和 draft/published 数据。
- [ ] Fifa 新增项目管理页面。
- [ ] Bobo 新增公开项目列表和详情，或把项目数据放到首页模块里展示。
- [ ] 发布项目后触发 revalidate 和搜索索引更新。
- [ ] 补 Momo projects 测试和 Bobo lib 测试。

涉及文件：

```text
packages/contracts/src/projects
apps/momo/src/modules/projects
apps/momo/src/infra/db/schema/projects.schema.ts
apps/fifa/src/api/projects
apps/fifa/src/features/projects
apps/bobo/lib
apps/bobo/app/(site)
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:fifa
cd apps/fifa && pnpm test
pnpm type-check:bobo
pnpm --filter @xdd-zone/bobo test
```

### 第八阶段：站点级搜索

目标：公开搜索接口可以查文章，后续能查项目和页面。

清单：

- [ ] 新增 `packages/contracts/src/search`。
- [ ] 新增 `apps/momo/src/modules/search`。
- [ ] 定义搜索文档 DTO：`id`、`type`、`title`、`summary`、`url`、`publishedAt`。
- [ ] 文章发布后通过 outbox 写入或更新搜索索引。
- [ ] 文章归档或删除后从索引删除。
- [ ] 新增 Bobo 搜索读取函数和页面。
- [ ] 补 disabled search 和 Meilisearch 的业务测试。

涉及文件：

```text
packages/contracts/src/search
apps/momo/src/modules/search
apps/momo/src/infra/search
apps/momo/src/modules/content/services/content.service.ts
apps/bobo/lib
apps/bobo/app/(site)
```

验证命令：

```bash
pnpm type-check:momo
cd apps/momo && pnpm test
pnpm type-check:bobo
pnpm --filter @xdd-zone/bobo test
```

## 当前不做

这些事先不要做：

- 不做多站点后台。`siteKey = "bobo"` 只作为数据范围。
- 不做 editor、viewer、资源级权限和多人协作。
- 不做通用页面搭建器。
- 不上 Redis/BullMQ/NATS 这类外部队列。
- 不一次性改完所有表名和路由路径。
- 不把 Bobo 的固定视觉资源搬进素材库。
- 不把 Fifa 页面 view model 或 Bobo 组件 props 放进 contracts。

## 第一批建议执行的任务

如果马上开始改代码，建议按这个顺序做：

1. 做 Bobo revalidate route 和 Momo revalidate client。
2. 改文章发布接口，让刷新失败返回 warning，但不回滚发布。
3. 给发布后任务加测试。
4. 增加 outbox 表和 job 处理。
5. 迁 assets 模块。
6. 修文章 draft/published 字段分离。

第一批不要同时做 site、projects 和 search。先把现有文稿发布流程变稳，再新增内容类型。

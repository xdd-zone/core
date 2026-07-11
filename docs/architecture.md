# 系统设计

这份文档只写 `xdd/core` 的系统方向和模块边界。

## 项目方向

`xdd/core` 是一个面向个人站点的内容管理系统。

当前公开站点是 Bobo。Momo 保存业务数据并提供接口。Fifa 是后台管理入口。`packages/contracts` 放跨应用 API 的请求 schema、响应类型和错误码。

文章只是第一类内容。后续还会有个人资料、项目、首页配置、导航、页面配置和其他个性化页面数据。系统不要按“博客”设计，也不要做通用页面搭建器。

## 应用职责

### Momo

`apps/momo` 是 Hono API 服务。这里以数据库里的业务数据为准。

Momo 负责：

- 登录、session 和后台 owner 检查。
- 文稿、分类、标签、预览 token 和发布状态。
- 站点配置、个人资料、项目、素材和后续站点级数据。
- 管理端接口和公开站点接口。
- 发布后的任务，比如刷新 Bobo 缓存、更新搜索索引。
- 文件存储、缓存、搜索、LLM、数据库这类外部资源接入。
- 通过受限 LogReader 查询部署环境保存的结构化运行日志。

Momo 不负责渲染 Bobo 页面，不负责决定 Bobo 的页面视觉，也不直接生成前台 HTML。

### Fifa

`apps/fifa` 是后台管理端。

Fifa 页面和菜单按管理工作组织。比如写文章、管素材、改首页、管项目。Fifa 的 `api` 目录按 Momo 模块组织，页面只调用 query 或 mutation hook，不直接 import `momoClient`。

Fifa 负责：

- 登录后台。
- 编辑草稿和配置。
- 触发预览、发布和重新刷新缓存。
- 展示保存、发布、刷新失败等操作结果。
- 检查 Momo 外部依赖状态，查看并重试 outbox 任务，查询结构化运行日志。

Fifa 不保存业务副本。表单状态和 TanStack Query cache 都是临时状态。

### Bobo

`apps/bobo` 是公开个人站点。

Bobo 负责页面结构、交互、metadata、RSS、sitemap 和公开渲染。Bobo 页面不直接拼 Momo RPC 请求，页面调用 `apps/bobo/lib` 里的领域读取函数。这些函数负责请求 Momo、处理错误、整理公开页面需要的数据。

Bobo 可以缓存公开数据。缓存只是 Momo 数据的派生结果，不是新的业务数据来源。

### Contracts

`packages/contracts` 是跨应用 API 的约定包。

Momo 给 Fifa 和 Bobo 用的请求 schema、响应 DTO、错误码和通用响应结构都放这里。Momo 内部 service 类型、数据库 record、Fifa 页面 view model、Bobo 页面组件类型不要放进这里。

### 共享主题和配置

`packages/catppuccin-theme` 放 Fifa 和 Bobo 共用的主题变量、色板和主题工具。

`packages/eslint-config` 放当前所有子包共用的 ESLint 和 Prettier 配置。

## 领域模块

### system 和 events

`system` 提供进程状态、依赖检查和运行日志查询。`GET /health` 只判断 Momo 进程是否能响应，`GET /rpc/system/readiness` 检查 PostgreSQL、缓存、搜索、文件存储和日志服务。

`events` 管理发布和归档产生的 `event_outbox`。Fifa 可以读取任务列表、查看失败原因并重试单条任务。通用 Pino 日志仍写到标准输出，由 Alloy 或部署平台采集并保存；Momo 不读取本地日志文件，也不把每条请求日志写入业务数据库。Fifa 只调用 Momo 的 owner-only 日志接口，不直接连接 Loki。

### content

`content` 是文稿模块，不是所有公开内容的统称。

这里放：

- 文章草稿、已发布文章和预览 token。
- 分类和标签。
- MDX 组件清单。
- 和文稿直接绑定的发布流程。

后续个人资料、项目、首页配置、导航和站点设置不要塞进 `content`。

### site

`site` 用来放站点级配置。

适合放：

- `siteKey = "bobo"`。
- 导航项。
- 首页模块开关和排序。
- SEO 默认值。
- RSS、sitemap 和搜索需要的站点配置。

当前只支持 Bobo 一个公开站点。`siteKey` 只是给数据一个明确范围，不代表现在要做多站点管理。

### profile

`profile` 放个人身份信息。

适合放：

- 显示名。
- 头像。
- 简介。
- 社交链接。
- 联系方式展示配置。

Fifa 可以管理这些数据，Bobo 公开页面从 Momo 读取。

### projects

`projects` 放项目和作品集这类结构化内容。

项目不是文章。它可以有自己的字段、排序、发布状态、截图和链接。项目截图引用 `assets`，不自己处理文件存储。

### assets

`assets` 应该是独立模块，不属于 `content`。

Momo 负责资产元数据，文件本体由存储驱动保存。文章封面、正文图片、项目截图、头像、首页图片都可以引用资产。

Bobo 代码里的固定图标、布局装饰和不可运营替换的图片继续放在 Bobo 代码仓库，不进素材库。

当前代码里素材接口还在 `content` 模块下。新增非文章资产使用方时，优先把素材能力迁到独立 `assets` 模块。

### search

搜索是站点级能力。

第一期可以只搜文章，但接口和结果类型按跨内容类型设计。搜索结果至少应该有 `type`、`title`、`summary`、`url` 和 `publishedAt`。文章、项目和页面配置发布后，各自触发搜索索引更新。

## 接口边界

Momo 给 Fifa 和 Bobo 的接口分开。

管理端接口用于 Fifa：

```text
/rpc/content/posts
/rpc/content/posts/:id
```

公开站点接口用于 Bobo：

```text
/rpc/bobo/content/posts
/rpc/bobo/content/posts/:slug
```

这两类接口可以共用 service、repository 和查询代码，但 route、contracts DTO 和 presenter 要分开。公开接口默认只返回已发布、可公开、适合缓存的数据。管理接口可以返回草稿、后台字段和操作状态。

不要用一个接口加参数同时服务后台和公开站点。这样容易把草稿字段或后台字段返回给公开页面。

## Bobo 读取 Momo 的方式

Bobo 页面调用 `apps/bobo/lib` 里的领域函数。

推荐写法：

```text
page.tsx -> getPublishedPosts() -> Momo 公开接口
page.tsx -> getPostBySlug() -> Momo 公开接口
page.tsx -> getHomePageData() -> Momo 公开接口
```

浏览器端确实需要写入时，再考虑 Bobo route handler 或公开端接口。普通公开页面不要直接在组件里拼 Momo URL。

## 发布和预览

### 草稿和已发布数据

可公开内容先使用 draft/published 快照分离。

Fifa 编辑 draft。Bobo 只读 published。预览接口读 draft。发布时把 draft 提升为 published。

常查、需要唯一约束或排序的字段放独立列。展示内容、SEO 补充、封面配置、页面 sections 和其他页面配置可以放 snapshot。snapshot 必须用 schema 校验。

slug 也按 draft/published 分离。Fifa 编辑 `draftSlug`，Bobo 只认 `publishedSlug`。发布后才更新公开 URL。

### 发布状态

可公开内容使用同一套最小状态语义：

```text
draft
published
archived
```

每个模块自己建表和 service，不做一张通用内容表。字段语义保持一致，比如 `status`、`publishedAt`、`updatedAt`。

### 预览

预览走独立通路。

```text
Fifa 创建 preview token
  -> 打开 Bobo 预览页面
  -> Bobo 用 token 调 Momo preview 接口
  -> Bobo 用真实前台组件渲染草稿
```

preview token 不要只绑定文章。模型上保留 `targetType`、`targetId` 和 `expiresAt`，后续项目、页面配置也能复用。

### 发布后的任务

发布成功后会有派生任务：

- 刷新 Bobo 缓存。
- 更新搜索索引。
- 刷新 sitemap 和 RSS。
- 让相关预览 token 失效。

发布动作只负责修改数据库里的业务状态。派生任务通过内部事件触发。第一阶段可以用进程内 handler；正式发布流程建议加 DB outbox 表。发布事务同时写业务数据和 outbox 记录，worker 再处理刷新缓存、更新搜索索引这类任务。

派生任务失败不回滚发布。Momo 记录失败原因，接口返回 warning，Fifa 显示可重试操作。

## 缓存和刷新

Bobo 公开页面默认可以缓存 Momo 公开数据。

推荐策略：

- 公开文章详情按 slug 缓存。
- 首页、文稿列表、分类页和标签页按路径或 tag 缓存。
- 站点配置、导航、RSS 和 sitemap 发布后刷新。
- 预览页面不缓存，或只用很短缓存。

Fifa 不直接调用 Bobo 刷新缓存。Fifa 调 Momo 发布，Momo 发布成功后调用 Bobo 的 revalidate endpoint。刷新失败时，发布仍然成功，Fifa 展示 warning 和重试入口。

## URL、SEO、RSS 和 sitemap

Bobo 是公开路由的代码来源。Momo 不决定 Bobo 的 Next.js 路由结构。

Momo 可以在公开 DTO 或搜索索引里提供 `type`、`slug` 和必要的 `path`，但路径生成规则要集中在 mapper 里，不要散在多个 service 里。完整 canonical URL 由 Bobo 或站点配置生成。

SEO metadata、RSS 和 sitemap 由 Bobo 生成。Momo 提供已发布内容、更新时间、摘要、slug 和站点配置。发布后由 Momo 触发 Bobo 刷新相关页面或 tag。

## 权限

当前是单 owner 后台。

- Fifa 管理接口必须登录。
- 登录用户通过 owner 检查后拥有全部后台能力。
- Bobo 公开接口不要求登录，只返回 published 数据。
- Preview 接口不要求后台登录，但必须有合法 token。

当前不做 editor、viewer、资源级权限和多人协作。不要提前在业务表里散落 `role`、`ownerId`、`permission` 这类暂时用不到的字段。

## 模块依赖

Momo 领域模块管理自己的数据和规则。跨模块流程放到明确的编排层或事件 handler。

推荐方向：

```text
route -> service/orchestrator -> domain services -> repositories
                         |
                         -> event/outbox handlers
```

不要让普通 service 随意互相 import。repository 不跨模块访问别的模块表细节。比如 `content` 可以引用稳定的 `assets` service 检查资产是否存在，但不要直接操作 `assets` repository。

## 个性化页面数据

个性化页面采用混合模型。

- 高价值、会查询、会复用的数据强类型建模，比如 `projects`、`profile`、`assets`。
- 首页 sections、导航项、显示开关、展示排序和少量文案可以用 JSON 配置。
- JSON 配置必须有 schema 和版本字段。
- Bobo 不直接读取数据库原始 JSON。Momo presenter 或 Bobo lib 先整理成公开 DTO。

Fifa 编辑策略也按内容类型区分：

- 文稿和长内容支持草稿、预览和发布。
- 项目详情如果内容较长，也可以支持草稿和发布。
- 站点配置、社交链接、短 profile 字段先用显式保存。
- 不做所有表单自动保存。

## 文件存储

Momo 通过存储驱动保存文件。

当前可以使用本地存储或腾讯云 COS。业务代码不要直接依赖本地文件路径。上传、读取、删除和公开 URL 生成都走存储驱动或 assets service。

推荐能力保持简单：

- 保存文件。
- 读取文件。
- 删除文件。
- 生成公开地址或读取地址。

不要提前做分片上传、多 bucket、图片处理队列和复杂 CDN 签名。

## 错误处理

不同入口按不同方式处理错误。

- Fifa：保存、发布、刷新失败都要显示明确原因。发布成功但刷新失败时，显示 warning 和重试入口。
- Bobo published 页面：数据不存在返回 404。Momo 短暂失败但有缓存时，继续使用缓存。
- Bobo preview 页面：token 过期、目标不存在或 token 无效时，显示专门的预览不可用状态。
- Momo API：继续使用统一 `ApiResponse` 和错误码。
- outbox/job：失败原因写入任务状态，方便重试。

## 测试策略

测试按模块边界写，不把所有正确性都压到端到端测试上。

推荐覆盖：

- `packages/contracts`：schema parse、DTO 类型和错误码。
- Momo route/service：发布状态、draft/published 快照、预览 token、公开接口不会返回草稿字段。
- Bobo lib：公开读取函数、错误处理、not found 和 preview 失败。
- Fifa API/query：RPC 包装、query key 和错误结构。
- 少量 E2E：发布文章后 Bobo 可访问，草稿预览 token 可访问，刷新缓存失败时 Fifa 能显示 warning。

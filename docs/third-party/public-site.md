# 个人站公开接口第三方接入说明

这份文档给外部站点读取 XDD Zone 的个人站公开内容使用。
调用方只要能发 HTTP 请求就能接，不限制前端框架、服务端语言或静态站点工具。

## 这份文档放在哪里

当前文档路径：

```text
docs/third-party/public-site.md
```

后端接口代码在这里：

```text
packages/nexus/src/modules/public-site/routes.ts
packages/nexus/src/modules/public-site/model.ts
packages/nexus/src/modules/comment/routes.ts
packages/nexus/src/modules/comment/model.ts
packages/nexus/src/modules/media/routes.ts
```

OpenAPI 页面在这里：

```text
http://localhost:7788/openapi
```

OpenAPI JSON 在这里：

```text
http://localhost:7788/openapi/json
```

## 什么时候看这份文档

外部站点要做这些页面时看这里：

- 首页读取站点标题、描述、logo、社交链接。
- 分类页读取分类列表。
- 文章列表页读取已发布文章。
- 分类文章页按分类 `slug` 读取文章。
- 文章详情页按文章 `slug` 读取 Markdown 正文。
- 文章详情页提交评论。

后台管理页面不要看这份文档。后台管理接口需要登录和权限。

## 接口基地址

本地开发：

```text
http://localhost:7788
```

生产环境把域名换成真实 API 域名：

```text
https://api.example.com
```

下文用 `API_BASE_URL` 表示接口基地址。

```text
API_BASE_URL=http://localhost:7788
```

## 请求规则

- 个人站内容接口都以 `/api/public-site` 开头。
- 当前个人站内容接口只读公开数据，不需要登录。
- 请求方法使用 `GET`。
- 返回内容是 JSON。
- 列表接口支持分页。
- 详情接口找不到内容时返回 `404`。
- `slug` 只允许小写字母、数字和短横线，最长 120 个字符。
- 时间字段是 ISO 字符串，例如 `2026-05-06T11:39:11.435Z`。

## 快速检查

服务启动后先用这些命令确认接口能访问：

```bash
curl http://localhost:7788/api/public-site/config
curl http://localhost:7788/api/public-site/categories
curl "http://localhost:7788/api/public-site/posts?page=1&pageSize=20"
```

如果部署到了线上，把 `http://localhost:7788` 换成线上 API 域名。

## 接口总表

| 方法 | 路径 | 用途 | 是否需要登录 |
| ---- | ---- | ---- | ---- |
| `GET` | `/api/public-site/config` | 读取站点配置 | 否 |
| `GET` | `/api/public-site/categories` | 读取分类列表 | 否 |
| `GET` | `/api/public-site/categories/:slug/posts` | 读取指定分类下的文章列表 | 否 |
| `GET` | `/api/public-site/posts` | 读取文章列表 | 否 |
| `GET` | `/api/public-site/posts/:slug` | 读取文章详情 | 否 |
| `POST` | `/api/comment/` | 提交评论 | 否 |
| `GET` | `/api/media/:id/file` | 读取媒体文件 | 否 |

个人站页面一般只需要前 5 个接口。
评论表单才需要 `/api/comment/`。
媒体文件通常直接使用接口返回的 URL，只有手里已经有媒体 ID 时才需要 `/api/media/:id/file`。

## 读取站点配置

用于首页、页面标题、页脚和 SEO 默认信息。

### 请求

```bash
curl http://localhost:7788/api/public-site/config
```

### 返回示例

```json
{
  "title": "XDD Zone",
  "subtitle": null,
  "description": null,
  "logo": "https://example.com/logo.png",
  "favicon": null,
  "footerText": null,
  "socialLinks": {},
  "defaultSeoTitle": null,
  "defaultSeoDescription": null
}
```

### 返回字段

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `title` | `string` | 站点标题 |
| `subtitle` | `string | null` | 站点副标题 |
| `description` | `string | null` | 站点描述 |
| `logo` | `string | null` | logo 图片 URL |
| `favicon` | `string | null` | favicon 图片 URL |
| `footerText` | `string | null` | 页脚文字 |
| `socialLinks` | `Record<string, string>` | 社交链接，key 是名称，value 是 URL |
| `defaultSeoTitle` | `string | null` | 默认 SEO 标题 |
| `defaultSeoDescription` | `string | null` | 默认 SEO 描述 |

## 读取分类列表

用于分类导航、分类筛选和分类页入口。

### 请求

```bash
curl http://localhost:7788/api/public-site/categories
```

带搜索关键词：

```bash
curl "http://localhost:7788/api/public-site/categories?keyword=技术"
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `keyword` | `string` | 否 | 按分类名称搜索 |

### 返回示例

```json
[
  {
    "id": "category-id",
    "name": "技术",
    "slug": "tech",
    "description": null,
    "sortOrder": 0,
    "postCount": 3
  }
]
```

### 返回字段

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `id` | `string` | 分类 ID |
| `name` | `string` | 分类名称 |
| `slug` | `string` | 分类路径名，用在分类文章接口里 |
| `description` | `string | null` | 分类描述 |
| `sortOrder` | `number` | 排序值，数字越小越靠前 |
| `postCount` | `number` | 当前分类下已发布文章数量 |

## 读取文章列表

用于首页文章流、归档页和搜索结果页。

### 请求

```bash
curl "http://localhost:7788/api/public-site/posts?page=1&pageSize=20"
```

按关键词搜索：

```bash
curl "http://localhost:7788/api/public-site/posts?keyword=Elysia&page=1&pageSize=20"
```

按标签筛选：

```bash
curl "http://localhost:7788/api/public-site/posts?tag=bun&page=1&pageSize=20"
```

按分类 `slug` 筛选：

```bash
curl "http://localhost:7788/api/public-site/posts?categorySlug=tech&page=1&pageSize=20"
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `page` | `number` | 否 | 页码，从 1 开始 |
| `pageSize` | `number` | 否 | 每页数量，最大 100 |
| `keyword` | `string` | 否 | 搜索关键词 |
| `categoryId` | `string` | 否 | 分类 ID |
| `categorySlug` | `string` | 否 | 分类路径名 |
| `tag` | `string` | 否 | 标签名 |

### 返回示例

```json
{
  "items": [
    {
      "id": "post-id",
      "title": "文章标题",
      "slug": "hello-world",
      "excerpt": "文章摘要",
      "coverImage": "https://example.com/cover.png",
      "category": {
        "id": "category-id",
        "name": "技术",
        "slug": "tech"
      },
      "tags": ["bun", "elysia"],
      "publishedAt": "2026-05-06T11:39:11.435Z",
      "createdAt": "2026-05-06T11:39:11.435Z",
      "updatedAt": "2026-05-06T11:39:11.435Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

### 分页字段

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `items` | `PublicSitePostSummary[]` | 当前页文章列表 |
| `total` | `number` | 文章总数 |
| `page` | `number` | 当前页码 |
| `pageSize` | `number` | 每页数量 |
| `totalPages` | `number` | 总页数 |

### 文章摘要字段

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `id` | `string` | 文章 ID |
| `title` | `string` | 文章标题 |
| `slug` | `string` | 文章路径名，用在文章详情接口里 |
| `excerpt` | `string | null` | 文章摘要 |
| `coverImage` | `string | null` | 封面图 URL |
| `category` | `object | null` | 分类信息 |
| `tags` | `string[]` | 标签列表 |
| `publishedAt` | `string` | 发布时间 |
| `createdAt` | `string` | 创建时间 |
| `updatedAt` | `string` | 更新时间 |

## 读取分类下的文章列表

用于分类详情页。
路径里的 `:slug` 填分类的 `slug`，不是分类 ID。

### 请求

```bash
curl "http://localhost:7788/api/public-site/categories/tech/posts?page=1&pageSize=20"
```

### 查询参数

和 `/api/public-site/posts` 一样：

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `page` | `number` | 否 | 页码，从 1 开始 |
| `pageSize` | `number` | 否 | 每页数量，最大 100 |
| `keyword` | `string` | 否 | 搜索关键词 |
| `categoryId` | `string` | 否 | 分类 ID |
| `categorySlug` | `string` | 否 | 分类路径名 |
| `tag` | `string` | 否 | 标签名 |

正常情况下不需要再传 `categoryId` 或 `categorySlug`，因为路径里已经带了分类 `slug`。

### 返回字段

返回结构和 `/api/public-site/posts` 一样。

## 读取文章详情

用于文章详情页。
路径里的 `:slug` 填文章的 `slug`，不是文章 ID。

### 请求

```bash
curl http://localhost:7788/api/public-site/posts/hello-world
```

### 返回示例

```json
{
  "id": "post-id",
  "title": "文章标题",
  "slug": "hello-world",
  "excerpt": "文章摘要",
  "coverImage": "https://example.com/cover.png",
  "category": {
    "id": "category-id",
    "name": "技术",
    "slug": "tech"
  },
  "tags": ["bun", "elysia"],
  "publishedAt": "2026-05-06T11:39:11.435Z",
  "createdAt": "2026-05-06T11:39:11.435Z",
  "updatedAt": "2026-05-06T11:39:11.435Z",
  "markdown": "# 正文标题\n\n这里是 Markdown 正文。"
}
```

### 返回字段

文章详情包含文章摘要的所有字段，并额外返回：

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `markdown` | `string` | Markdown 正文 |

## 提交评论

用于文章详情页的评论表单。
当前公开接口只允许创建评论，不提供公开评论列表。

### 请求

```bash
curl -X POST http://localhost:7788/api/comment/ \
  -H 'content-type: application/json' \
  -d '{
    "postId": "post-id",
    "authorName": "喜东东",
    "authorEmail": "hello@example.com",
    "content": "这是一条评论"
  }'
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `postId` | `string` | 是 | 文章 ID，不是文章 `slug` |
| `authorName` | `string` | 是 | 评论人名称，最多 80 个字符 |
| `authorEmail` | `string | null` | 否 | 评论人邮箱 |
| `content` | `string` | 是 | 评论内容，最多 2000 个字符 |

### 返回字段

接口返回创建后的评论。

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `id` | `string` | 评论 ID |
| `postId` | `string` | 文章 ID |
| `authorName` | `string` | 评论人名称 |
| `authorEmail` | `string | null` | 评论人邮箱 |
| `content` | `string` | 评论内容 |
| `status` | `pending | approved | hidden | deleted` | 评论状态 |
| `createdAt` | `string` | 创建时间 |
| `updatedAt` | `string` | 更新时间 |

### 注意点

- `postId` 必须是文章 ID。
- 文章不存在或未发布时返回 `404`。
- 新评论的初始状态由后端处理，前台不要自己拼状态。

## 读取媒体文件

文章列表和文章详情里的 `coverImage`、站点配置里的 `logo`、`favicon` 通常已经是完整 URL，直接用即可。

只有手里拿到媒体 ID 时，才需要请求这个接口：

```bash
curl http://localhost:7788/api/media/media-id/file
```

找不到媒体文件时返回 `404`。

## 错误返回

接口出错时返回 JSON，常见格式如下：

```json
{
  "code": 404,
  "message": "请求的资源不存在",
  "data": null,
  "errorCode": "NOT_FOUND"
}
```

### 常见状态码

| 状态码 | 场景 | 处理方式 |
| ---- | ---- | ---- |
| `200` | 请求成功 | 读取返回数据 |
| `404` | 分类、文章、媒体或评论目标不存在 | 页面显示未找到，或者跳到 404 页面 |
| `422` | 查询参数或请求体不合法 | 检查 `slug`、`page`、`pageSize`、评论表单字段 |
| `500` | 服务端出错 | 看后端日志 |

### 参数错误示例

```json
{
  "code": 422,
  "message": "请求参数验证失败",
  "data": null,
  "errorCode": "VALIDATION",
  "details": {
    "errors": [
      {
        "field": "pageSize",
        "message": "每页数量不能超过 100",
        "code": "too_big"
      }
    ]
  }
}
```

## JavaScript 调用示例

适合浏览器、Node.js、常见前端框架和静态站点生成器。

```ts
const API_BASE_URL = 'http://localhost:7788'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  return response.json() as Promise<T>
}

type PostList = {
  items: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    tags: string[]
    publishedAt: string
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const posts = await request<PostList>('/api/public-site/posts?page=1&pageSize=20')
```

## Python 调用示例

适合脚本、服务端渲染或定时同步内容。

```py
import requests

API_BASE_URL = "http://localhost:7788"

response = requests.get(
    f"{API_BASE_URL}/api/public-site/posts",
    params={"page": 1, "pageSize": 20},
    timeout=10,
)
response.raise_for_status()

posts = response.json()
print(posts["items"])
```

## PHP 调用示例

适合普通 PHP 页面或 WordPress 自定义模板。

```php
<?php

$apiBaseUrl = 'http://localhost:7788';
$response = file_get_contents($apiBaseUrl . '/api/public-site/posts?page=1&pageSize=20');

if ($response === false) {
    throw new RuntimeException('请求文章列表失败');
}

$posts = json_decode($response, true);
print_r($posts['items']);
```

## 类型怎么拿

如果第三方项目在同一个 monorepo 里，或者能安装 `@xdd-zone/nexus` 包，可以直接导入类型：

```ts
import type {
  PublicSiteCategory,
  PublicSiteCategoryList,
  PublicSiteConfig,
  PublicSitePost,
  PublicSitePostList,
  PublicSitePostSummary,
} from '@xdd-zone/nexus/public-site-types'
```

如果第三方项目拿不到这个包，就按本文件里的字段表手写类型。
也可以读取 OpenAPI JSON 生成客户端代码：

```bash
curl http://localhost:7788/openapi/json -o openapi.json
```

## 页面和接口怎么对应

| 页面 | 需要调用的接口 |
| ---- | ---- |
| 首页 | `/api/public-site/config`、`/api/public-site/posts` |
| 分类导航 | `/api/public-site/categories` |
| 分类详情页 | `/api/public-site/categories/:slug/posts` |
| 文章列表页 | `/api/public-site/posts` |
| 文章详情页 | `/api/public-site/posts/:slug` |
| 文章评论表单 | `/api/comment/` |

## 上线前检查

上线前按顺序检查：

1. API 域名是否能从公网访问。
2. 外部站点里配置的 `API_BASE_URL` 是否是正确域名。
3. `curl API_BASE_URL/api/public-site/config` 是否返回 `200`。
4. 文章列表是否只显示已发布文章。
5. 文章详情页传的是文章 `slug`。
6. 分类详情页传的是分类 `slug`。
7. 评论表单传的是文章 `id`。
8. 图片 URL 是否能在浏览器直接打开。

## 常见错误

### 把文章 ID 当成 slug

错误写法：

```text
/api/public-site/posts/cmolo...
```

正确写法：

```text
/api/public-site/posts/hello-world
```

文章详情接口路径里要传文章 `slug`。

### 把分类 ID 当成 slug

错误写法：

```text
/api/public-site/categories/cmolo.../posts
```

正确写法：

```text
/api/public-site/categories/tech/posts
```

分类文章接口路径里要传分类 `slug`。

### 评论接口传了文章 slug

错误请求体：

```json
{
  "postId": "hello-world",
  "authorName": "喜东东",
  "content": "这是一条评论"
}
```

正确请求体：

```json
{
  "postId": "post-id",
  "authorName": "喜东东",
  "content": "这是一条评论"
}
```

评论接口的 `postId` 要传文章 ID。

### pageSize 超过 100

错误请求：

```text
/api/public-site/posts?page=1&pageSize=500
```

正确请求：

```text
/api/public-site/posts?page=1&pageSize=100
```

`pageSize` 最大 100。

## 相关文件

- `docs/api.md`
  全量接口表。
- `packages/nexus/src/modules/public-site/routes.ts`
  个人站内容接口路径。
- `packages/nexus/src/modules/public-site/model.ts`
  个人站内容接口参数和返回结构。
- `packages/nexus/src/modules/comment/routes.ts`
  评论创建接口路径。
- `packages/nexus/src/modules/comment/model.ts`
  评论创建接口请求体和返回结构。
- `packages/nexus/src/public/public-site-types.ts`
  TypeScript 类型导出。

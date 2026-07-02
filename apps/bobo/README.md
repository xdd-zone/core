# @xdd-zone/bobo

`@xdd-zone/bobo` 是 XDD Zone Core 的公开个人站点，代码放在 `apps/bobo`。

技术栈是 `Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript`。开发服务默认使用 `4399` 端口。

Bobo 负责页面结构、交互、metadata、RSS 和 sitemap。业务数据从 Momo 公开接口读取，页面通过 `apps/bobo/lib` 里的领域读取函数拿数据，不直接拼 Momo URL。

## 现在能做什么

- 首页在 `app/(site)/page.tsx`，URL 仍然是 `/`。
- 文稿列表在 `app/(site)/writing/page.tsx`，URL 是 `/writing`。
- 文稿详情在 `app/(site)/writing/[slug]/page.tsx`，URL 是 `/writing/<slug>`。
- 样式演示和临时页面放在 `app/(lab)/lab`，URL 仍然是 `/lab`。
- 文章预览页在 `app/(preview)/preview/posts/[postId]/page.tsx`。
- 全局布局、字体、metadata 和主题初始化放在 `app/layout.tsx`。
- Catppuccin 主题从 `@xdd-zone/catppuccin-theme/styles/bobo.css` 引入。
- Next 服务端代码通过 `MOMO_BASE_URL` 读取 Momo 地址。

## 常用命令

在 monorepo 根目录执行：

```bash
pnpm dev:bobo
pnpm lint:bobo
pnpm type-check:bobo
pnpm build:bobo
pnpm --filter @xdd-zone/bobo test
```

打开 [http://localhost:4399](http://localhost:4399) 查看页面。

生产服务用子包脚本启动：

```bash
pnpm --filter @xdd-zone/bobo start
```

## 常改位置

- `app/(site)/page.tsx`
  首页。
- `app/(site)/writing/page.tsx`
  文稿列表页，读取 `MOMO_BASE_URL` 指向的 Momo 公开文章接口。
- `app/(site)/writing/[slug]/page.tsx`
  文稿详情页，按 slug 读取已发布文章。
- `app/(site)/_components/home`
  首页专用交互组件。
- `app/(site)/_components/site`
  公开站点共用导航、分类菜单和底部区域。
- `app/(preview)/preview/posts/[postId]/page.tsx`
  文章预览页，读取 `MOMO_BASE_URL` 指向的 Momo 预览接口。
- `app/layout.tsx`
  全局布局、字体、metadata 和主题初始化脚本。
- `app/globals.css`
  全局样式入口，导入主题和基础样式，并定义首页动画 token。
- `app/styles`
  基础样式和动画工具类。
- `components`
  跨页面复用的站点组件。当前主题切换组件在 `components/site/theme-toggle.tsx`。
- `lib`
  主题函数、工具函数、环境变量校验、Momo HTTP 请求封装和 Bobo 公开内容 API 调用。

## 环境变量

示例文件在 `apps/bobo/.env.example`。

```text
MOMO_BASE_URL=http://localhost:7788
BOBO_ALLOWED_DEV_ORIGINS=localhost,127.0.0.1
```

本地开发配置放在 `apps/bobo/.env.development`。`MOMO_BASE_URL` 只给 Next 服务端代码读取，启动配置和服务端请求都会校验它。

## 改动前看哪里

详细维护规则看：

- [docs/apps/bobo.md](../../docs/apps/bobo.md)
- [docs/topics/theme.md](../../docs/topics/theme.md)

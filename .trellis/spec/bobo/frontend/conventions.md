# Bobo

- 页面在 `app/`；首页是 `app/(site)/page.tsx`，实验页放 `app/(lab)/lab`。
- 默认写服务端组件。只有事件、状态或浏览器 API 才加 `'use client'`，例子是 `hooks/use-theme.ts`。
- 请求封装放 `lib/api/*.api.ts`，公共请求和错误转换放 `lib/http.ts`。页面不直接请求 Momo。
- 主题从 `@xdd-zone/catppuccin-theme/styles/bobo.css` 引入，使用 `data-theme` 和语义类名。
- 测试紧挨被测模块，例子：`lib/api/post.api.test.ts`、`lib/content/preview.test.ts`。

检查：`pnpm type-check:bobo && pnpm lint:bobo && pnpm --dir apps/bobo format:check`。

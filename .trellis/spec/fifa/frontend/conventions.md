# Fifa

- 功能页面和路由记录放 `src/features/<module>/pages`、`routes.tsx`；例子是 `features/site/routes.tsx`。
- 新模块加入 `app/router/records.ts`；路由树和菜单分别由 `app/router/routes.tsx`、`app/navigation/navigation.ts` 生成。
- 请求函数放 `src/api/<module>/*.api.ts`，React Query 封装放同目录 `*.query.ts`。
- 共用 UI 放 `components/`，布局放 `layout/`。不要绕过路由记录直接写菜单。
- 测试放 `src/test/`，按接口、路由或功能目录归类。

检查：`pnpm type-check:fifa && pnpm lint:fifa && pnpm --dir apps/fifa format:check`。

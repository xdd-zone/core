# Momo

- 启动入口是 `src/index.ts`；Hono 装配在 `bootstrap/create-app.ts`，路由总入口在 `routes/index.ts`。
- 业务代码放 `modules/<module>`。route 处理 HTTP 和校验，service 处理业务，repository 处理数据库；参考 `modules/projects/`。
- 响应使用 `shared/response.ts`，业务错误使用 `shared/app-error.ts`。不要在 route 拼数据库查询。
- Drizzle schema 在 `infra/db/schema/`；接口 contract 先放到 `@xdd-zone/contracts`。
- 测试放 `src/test/`，按 bootstrap、infra、middleware、modules 分组。

检查：`pnpm --dir apps/momo type-check && pnpm lint:momo && pnpm --dir apps/momo format:check`。

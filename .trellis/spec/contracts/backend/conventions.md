# Contracts

- 每个业务域一个 `<domain>.contract.ts`，例如 `projects/projects.contract.ts`。
- 请求、响应和枚举优先用 Zod schema 推导类型；不要在应用侧复制结构。
- 公共响应构造使用 `common/response.ts` 的 `buildSuccess`、`buildFailure`。
- 所有公开 contract 都从 `src/index.ts` 导出。改字段时同时检查 Momo route 和 Bobo、Fifa 调用方。

检查：`pnpm --dir packages/contracts type-check && pnpm lint && pnpm --dir packages/contracts format:check`。

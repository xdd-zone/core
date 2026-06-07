# Eden 状态

当前仓库没有接入 Eden。

## 当前情况

- `apps/nexus` 使用 Hono，不是 Elysia。
- `apps/nexus/src/index.ts` 导出 `AppType`。
- `apps/console` 当前没有创建后端 API 客户端。
- `apps/console` 当前没有调用 Nexus 业务接口。

## 如果以后要接前后端类型

先看当前后端结构：

```text
apps/nexus/src/index.ts
```

新增接口时要保留：

```ts
export type AppType = typeof app
```

具体客户端方案等代码接入后，再补这份文档。

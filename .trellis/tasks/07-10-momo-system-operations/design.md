# Momo 系统运行页设计

## Scope

本设计分两阶段。

第一阶段在当前任务实现：

- Momo readiness 查询。
- outbox 列表、详情和单条重试。
- Fifa 系统运行页面。

第二阶段只记录后续接法，不在当前任务实现：

- 部署环境保存 Pino JSON 日志。
- Momo 通过受限 reader 查询 Loki 或托管日志服务。
- Fifa 增加通用日志表格。

## Boundaries

### Packages contracts

新增：

```text
packages/contracts/src/events/events.contract.ts
packages/contracts/src/system/readiness.contract.ts
```

这里只放 Zod schema、请求类型和响应 DTO。

### Momo events

`apps/momo/src/modules/events` 继续管理 `event_outbox`。

```text
events.route.ts
  -> events.service.ts
    -> events.repository.ts
  -> events.presenter.ts
```

- route 负责 owner 检查、query 校验和 Hono response。
- service 负责分页参数、记录不存在错误和事件重试。
- repository 负责列表、计数、详情和状态写入。
- presenter 把 Date 转成 ISO string，并控制列表和详情字段。

### Momo system

`apps/momo/src/modules/system` 增加 readiness service。公共 `/health` 不访问外部资源。

```text
GET /health
  -> 固定 liveness

GET /rpc/system/readiness
  -> fifa.owner guard
  -> 并行检查 database/cache/search/storage
  -> 返回每项状态和总状态
```

检查方式：

- database：执行 `select 1`。
- cache：写入短 TTL 随机 key，读取后删除。
- search：调用现有 `SearchDriver.health()`；未启用时返回 `disabled`。
- storage：给 `StorageDriver` 增加 `health()`。
  - local：创建根目录并检查读写权限。
  - COS：调用 `headBucket` 检查 bucket 访问权限。

单项检查捕获错误，只返回固定中文说明，不返回外部 SDK 原始响应。

### Fifa

新增：

```text
apps/fifa/src/features/system/pages/SystemOperations.tsx
apps/fifa/src/features/system/routes.tsx
apps/fifa/src/api/events/*
apps/fifa/src/api/system/*
```

页面只调用 TanStack Query hooks。`momoClient` 只出现在 `api` 目录。

页面结构：

1. `FifaPageHeader`：标题、总状态、检查时间、刷新按钮。
2. readiness 状态带：四项依赖按紧凑列表展示，不做大统计卡。
3. outbox 工具栏：状态筛选、事件类型输入、刷新。
4. outbox 表格：主要信息和单条操作。
5. Drawer：错误原因、时间、payload。

## Data Flow

### Readiness

```text
Fifa page
  -> useSystemReadinessQuery
  -> Hono RPC GET /rpc/system/readiness
  -> system service
  -> runtime drivers / database
  -> SystemReadinessResponse
  -> status list
```

### Outbox list

```text
filters + page
  -> useEventsOutboxQuery
  -> Hono RPC GET /rpc/events/outbox
  -> repository count + page query
  -> presenter
  -> table
```

### Single retry

```text
retry button
  -> POST /rpc/events/outbox/:eventId/retry
  -> find event
  -> mark pending
  -> handle only this event
  -> mark done or failed
  -> invalidate outbox/readiness queries
```

## Security

- 所有新增 RPC 接口使用 `createRequireFifaOwner()`。
- readiness 错误说明使用固定文案。
- outbox payload 只对 owner 返回。
- 不记录或返回 API key、Cookie、Authorization、数据库 URL 和存储密钥。
- Fifa 不接受任意 SQL、LogQL 或文件路径。

## Compatibility

- `/health` 响应保持不变。
- `POST /rpc/events/outbox/retry` 保持不变。
- 新增 `StorageDriver.health()` 后同步 LocalStorage、CosStorage 和测试 mock。
- 不修改数据库 schema，不生成 migration。

## Phase 2 Log Reader

后续部署环境确定后，再创建独立任务实现：

```text
Pino JSON stdout
  -> Loki / deployment log service
  -> Momo LogReader
  -> owner-only /rpc/system/logs
  -> Fifa /system/operations logs tab
```

`LogReader` 只接受固定查询字段：时间范围、level、module、event、requestId、path 和 cursor。前端不能提交任意 LogQL。第一版只查询 `warn`、`error`、5xx 和慢请求。

## Rollback

- readiness 某个检查不稳定时，可以只移除该检查，不影响 `/health`。
- outbox 新接口可以独立移除，原批量重试接口仍可使用。
- Fifa 页面通过单独 route record 注册，移除 route record 即可隐藏入口。

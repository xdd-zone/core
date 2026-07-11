# Momo 系统运行页

## Goal

给 Fifa owner 提供一个系统运行页面，用来检查 Momo 依赖状态、查看发布后任务、重试单条失败任务，并查询部署环境保存的结构化运行日志。通用 Pino 日志仍然写到标准输出，不写入 PostgreSQL，也不读取本地日志文件。

## Background

- Momo 已使用 Pino 输出结构化日志，HTTP 日志包含 `event`、`module`、`requestId`、`path`、`status` 和 `durationMs`。
- LLM 调用日志已经写入 `llm_call_logs`，Fifa 的 `/settings/llm` 可以查看。
- `event_outbox` 已保存状态、失败原因、尝试次数和下次执行时间，但只有批量重试接口，没有列表、详情和单条重试接口。
- 公共 `/health` 只用于进程存活检查，固定返回 `ok`，不能说明数据库、缓存、搜索和存储是否可用。
- Fifa 原来没有系统运行模块。
- 日志阶段由子任务 `07-10-momo-log-viewer` 实现，使用独立 Loki/Alloy 配置保存和查询 Pino JSON。

## Requirements

### R1 Readiness

- 保留公共 `GET /health` 的现有响应，继续作为 liveness 接口。
- 新增仅限 `fifa.owner` 调用的 `GET /rpc/system/readiness`。
- readiness 检查 PostgreSQL、cache、search 和 storage。
- 每项返回名称、provider、状态、耗时和可选说明。
- 状态使用 `ready`、`disabled`、`error`。任意必需依赖为 `error` 时，总状态为 `degraded`。
- 返回内容不得包含数据库地址、密钥、Cookie、请求头或完整异常对象。

### R2 Outbox query and retry

- 新增 `GET /rpc/events/outbox`，支持按状态、事件类型分页筛选。
- 新增 `GET /rpc/events/outbox/:eventId`，返回单条记录和 payload。
- 新增 `POST /rpc/events/outbox/:eventId/retry`，立即重试指定记录并返回处理结果。
- 保留现有 `POST /rpc/events/outbox/retry` 批量重试接口。
- 查询和重试接口都只允许 `fifa.owner` 调用。
- 记录不存在时返回统一 `404` 错误。

### R3 Contracts

- readiness 和 outbox 的请求 schema、响应 DTO 放在 `packages/contracts`。
- Contracts 不包含 Drizzle record、repository 类型或 Fifa 组件类型。
- Fifa 使用 Hono RPC client，不手写同一份响应结构。

### R4 Fifa page

- 新增 `/system/operations` 页面和“系统”菜单分组。
- 页面顶部显示 readiness 总状态、检查时间和刷新操作。
- 页面显示数据库、缓存、搜索、存储四项检查结果。
- outbox 使用表格展示事件类型、状态、尝试次数、下次执行时间和更新时间。
- 支持状态、事件类型筛选和分页。
- 详情使用 Drawer，显示错误原因、时间字段和格式化 payload。
- failed 或 pending 记录可以单条重试；重试后刷新 readiness 和 outbox 查询。
- 窄屏允许表格横向滚动，不改成卡片列表。

### R5 Documentation

- 更新 Momo、Fifa 和 API 正式文档中的接口、模块和页面说明。
- 文档说明 `/health` 与 `/rpc/system/readiness` 的用途区别。
- 文档说明通用 Pino 日志由部署环境保存，Momo 只提供受限字段查询，不提供本地文件读取或任意 LogQL。

### R6 Runtime logs

- readiness 增加 `logging` 检查项，支持 `ready`、`disabled` 和 `error`。
- 新增仅限 `fifa.owner` 调用的 `GET /rpc/system/logs`。
- Momo 通过 `DisabledLogReader` 或 `LokiLogReader` 查询日志，Fifa 不直接访问 Loki。
- 查询最长 24 小时，单次最多 200 条，只接受固定筛选字段和 opaque cursor。
- Fifa 系统运行页增加“运行日志”Tab，支持快捷筛选、文本筛选、加载更多和详情 Drawer。
- 日志返回前递归隐藏敏感字段，并限制字符串、数组、对象字段和嵌套深度。

## Acceptance Criteria

- [x] 未登录或非 owner 请求 readiness、outbox 列表、详情、单条重试时被拒绝。
- [x] readiness 能区分 `ready`、`disabled` 和 `error`，单项失败不会让接口本身返回 500。
- [x] outbox 列表分页总数正确，筛选状态和事件类型有效。
- [x] 单条重试只处理指定事件，成功后记录变为 `done`，失败后保留错误信息。
- [x] Fifa `/system/operations` 能刷新状态、筛选 outbox、打开详情和重试单条记录。
- [x] Contracts、Momo、Fifa 的相关测试通过。
- [x] `pnpm type-check`、`pnpm lint`、`pnpm format:check` 依次通过。
- [x] 正式项目文档已经同步。
- [x] 日志未启用时 readiness 显示 `disabled`，Fifa 不发送日志查询。
- [x] Loki reader 只生成受限 LogQL，并按时间倒序返回脱敏后的统一 DTO。
- [x] Fifa 可以筛选日志、查看详情并按 Request ID 继续查询。
- [x] 独立 Loki/Alloy Compose 配置通过校验，不影响现有 `local:up`。

## Out Of Scope

- 在 PostgreSQL 中保存每条 Pino 日志。
- 读取 Momo 本地日志文件或容器 stdout。
- 实时日志滚动、日志导出、日志删除和任意查询语句。
- 告警、Alertmanager、短信、邮件和 Webhook 通知。
- Metrics、Tracing 和 OpenTelemetry 接入。
- 完整的 Momo、Fifa、Bobo 生产 Docker 编排。
- outbox 自动 worker 和定时任务。
- 多人权限和新的后台角色。

# Momo 日志查看

## Goal

给 Fifa owner 提供 Momo 运行日志查询页面，用来定位 5xx、慢请求和基础设施错误。Momo 继续把 Pino JSON 写到标准输出，日志服务负责采集和保存，Fifa 不直接访问 Loki。

## Background

- Momo 生产环境已经输出 Pino JSON，HTTP 日志包含 `event`、`module`、`requestId`、`path`、`status` 和 `durationMs`。
- Fifa 已有 `/system/operations` 页面，当前显示 readiness 和 outbox。
- 生产部署暂未确定，第一运行基线按 VPS 和 Docker 设计。
- 日志读取默认关闭。未配置 Loki 时，Momo 和 Fifa 仍能正常运行。

## Requirements

### R1 Log fields and safety

- Momo 日志继续写到 stdout，不写入 PostgreSQL，也不读取本地日志文件。
- Pino 基础字段保留 `service` 和 `env`，并支持可选的 `release` 和 `instance`。
- 运行日志统一使用 `module`、`event` 和 `errorMessage` 等结构化字段。
- 日志读取结果必须递归隐藏密码、Token、Cookie、Authorization 和 secret 字段。
- 外部响应正文和扩展字段必须限制长度，不能把整段未知内容直接返回 Fifa。

### R2 LogReader

- 在 Momo 内新增窄接口 `LogReader`，第一版只有 `DisabledLogReader` 和 `LokiLogReader`。
- `LOG_READER_PROVIDER` 支持 `none` 和 `loki`，默认 `none`。
- Loki 配置只由 Momo 读取，Fifa 不保存 Loki 地址和凭证。
- 不新增通用插件系统或共享 logging package。
- readiness 增加 `logging` 检查项。未启用时返回 `disabled`，配置后访问失败返回 `error`。

### R3 Logs API

- 新增仅限 `fifa.owner` 调用的 `GET /rpc/system/logs`。
- 支持相对时间范围、自定义起止时间、最低日志级别、module、event、requestId、path、状态码范围、最小耗时和 cursor。
- 默认查询最近 1 小时，最长允许 24 小时。
- 默认返回 100 条，最多返回 200 条。
- Momo 根据固定字段生成 LogQL，接口不接受任意 LogQL、文件路径或查询表达式。
- 日志服务未启用或不可用时返回统一错误，不返回 Loki 原始响应。

### R4 Contracts

- 日志查询 schema、响应 DTO 和日志条目类型放在 `packages/contracts/src/system`。
- Contracts 不包含 Loki response、LogQL、Fifa 组件类型或 Momo 内部 reader 类型。
- Fifa 继续使用 Hono RPC client，不手写重复响应类型。

### R5 Fifa page

- `/system/operations` 改为“依赖状态”“后台任务”“运行日志”三个 Tab。
- 页面头部继续显示 readiness 总状态和检查时间。
- 刷新按钮只刷新当前 Tab 使用的数据。
- 运行日志默认查询最近 1 小时，默认筛选 `warn` 及以上。
- 提供全部、异常、错误、5xx 和慢请求快捷筛选。
- 支持 module、event、path 和 requestId 筛选。
- 表格显示时间、级别、module/event、消息、请求状态和耗时。
- 点击日志行打开 Drawer，显示脱敏后的结构化字段，并支持复制或筛选相同 requestId。
- 日志未启用时显示短说明，不持续发送查询请求。
- 第一版使用手动刷新，不做实时滚动和自动刷新。

### R6 Optional Docker observability stack

- 新增独立的可观测 Compose 文件和 Loki/Alloy 配置，不修改现有 `pnpm local:up` 默认行为。
- Loki 使用独立 volume，初始日志保留时间为 7 天。
- Alloy 从 Docker 日志采集 Momo Pino JSON，并给 Loki 写入固定的 `service`、`env` 和 `module` 标签。
- 当前仓库不新增完整生产部署编排；配置只作为未来 VPS Docker 部署的日志部分。

### R7 Documentation

- 更新 Momo、Fifa、API、架构和环境变量说明。
- 文档写清日志数据流、启用命令、查询限制和未启用时的行为。
- 文档说明第一版不提供告警、日志导出和日志删除。

## Acceptance Criteria

- [x] 未登录或非 owner 请求日志接口时被拒绝。
- [x] 未启用日志读取时 readiness 显示 `disabled`，Fifa 页面不发送日志查询。
- [x] Loki reader 能生成受限查询，解析多条 stream，并按时间倒序返回统一 DTO。
- [x] 查询时间超过 24 小时或 limit 超过 200 时校验失败。
- [x] 日志条目中的敏感字段被递归隐藏，超长扩展字段被截断。
- [x] Fifa 可以切换三个 Tab、筛选日志、刷新结果、打开详情和按 requestId 继续筛选。
- [x] 可观测 Compose 配置不会被现有 `pnpm local:up` 自动启动。
- [x] Contracts、Momo、Fifa 的相关测试通过。
- [x] `pnpm type-check`、`pnpm lint`、`pnpm format:check` 依次通过。
- [x] 正式项目文档已经同步。

## Out Of Scope

- 错误告警、Alertmanager、短信、邮件和 Webhook 通知。
- Metrics、Tracing 和 OpenTelemetry 接入。
- 实时日志滚动、WebSocket 和 SSE。
- 任意 LogQL、全文查询表达式和跨服务日志查询。
- 日志导出、删除、归档和审计留存。
- 把通用 Pino 日志写入 PostgreSQL。
- 完整的 Momo、Fifa、Bobo 生产 Docker 编排。

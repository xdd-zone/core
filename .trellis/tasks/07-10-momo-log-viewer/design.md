# Momo 日志查看设计

## Architecture

```text
Momo Pino JSON stdout
  -> Docker logs
  -> Grafana Alloy
  -> Loki
  -> Momo LogReader
  -> owner-only GET /rpc/system/logs
  -> Fifa /system/operations 运行日志 Tab
```

日志生产、采集、保存和查询分开。Momo 和 Fifa 只约定平台无关的查询字段和响应 DTO。Loki 只出现在 Momo `infra/logs` 和部署配置中。

## Boundaries

### Contracts

新增：

```text
packages/contracts/src/system/logs.contract.ts
```

包含：

- `SystemLogLevelSchema`
- `SystemLogListQuerySchema`
- `SystemLogEntrySchema`
- `SystemLogListResponseSchema`

查询使用 `rangeMinutes` 或 ISO 起止时间、固定筛选字段和 opaque cursor。响应里的 `context` 只能使用 JSON 值。

### Momo logs infra

新增：

```text
apps/momo/src/infra/logs/log-reader.ts
apps/momo/src/infra/logs/disabled-log-reader.ts
apps/momo/src/infra/logs/loki-log-reader.ts
apps/momo/src/infra/logs/index.ts
```

`LogReader` 提供：

```ts
interface LogReader {
  health(): Promise<LogReaderHealth>
  query(input: LogReaderQuery): Promise<LogReaderResult>
}
```

- `DisabledLogReader.health()` 返回 `disabled`。
- `DisabledLogReader.query()` 返回未启用错误。
- `LokiLogReader.health()` 请求 Loki `/ready`。
- `LokiLogReader.query()` 请求 `/loki/api/v1/query_range`，解析 stream values，统一排序并生成 cursor。
- Loki 凭证通过 Basic Auth 和可选 `X-Scope-OrgID` 发送。

`LokiLogReader` 只生成这些条件：

```text
service="momo"
minimum level
module
event
requestId
path
status range
minimum duration
```

字符串值必须做 LogQL 字符串转义。前端不能传入 selector 或 pipeline 内容。

### Log normalization

Pino JSON line 解析后分成两部分：

- 固定字段：时间、级别、消息、service、env、release、instance、module、event、requestId、method、path、status、duration 和错误字段。
- `context`：剩余字段经过递归脱敏、深度限制、数组长度限制和字符串长度限制。

读取失败的非 JSON 行可以返回基础条目，但不能把超过限制的原始文本完整返回。

### Momo runtime and system module

`MomoRuntime` 增加 `logs: LogReader`。`createRuntime()` 根据 `LOG_READER_PROVIDER` 创建 reader。

`apps/momo/src/modules/system` 继续管理 readiness 和日志查询：

```text
GET /rpc/system/readiness
  -> database/cache/search/storage/logging health

GET /rpc/system/logs
  -> fifa.owner guard
  -> query validation
  -> system service
  -> LogReader.query()
  -> platform-neutral response
```

日志未启用时，service 返回固定业务错误。Loki 网络错误、超时和响应错误统一转换，不把响应正文返回给 Fifa。

### Fifa

现有 `SystemOperations.tsx` 拆成贴近页面的三个 section 组件，仍留在 system feature 内，不提取共享组件：

```text
SystemOperations
├── ReadinessSection
├── OutboxSection
└── LogsSection
```

页面使用 Ant Design `Tabs`。运行日志只调用 `apps/fifa/src/api/system` 的 query hook。

日志筛选使用受控 query state：

- 快捷筛选修改最低级别、状态码或最小耗时。
- 文本筛选点击查询后生效，避免每个键盘输入都请求。
- 相对时间范围使用 `rangeMinutes`，每次手动刷新都会重新计算最新时间窗口。
- cursor 保存首次查询的起止边界，“加载更多”不会因为当前时间变化而漏掉旧日志。
- cursor 只提供“加载更多”，不显示页码。
- 点击相同 requestId 后重置 cursor 并重新查询。

## Configuration

新增 Momo 环境变量：

```text
APP_RELEASE
APP_INSTANCE_ID
LOG_READER_PROVIDER=none|loki
LOKI_URL
LOKI_USERNAME
LOKI_PASSWORD
LOKI_TENANT_ID
LOG_QUERY_TIMEOUT_MS=5000
```

规则：

- `LOG_READER_PROVIDER=none` 时不要求 Loki 变量。
- `LOG_READER_PROVIDER=loki` 时必须提供 `LOKI_URL`。
- `LOKI_USERNAME` 和 `LOKI_PASSWORD` 必须同时配置或同时留空。
- 凭证不能进入日志字段和 API 响应。

## Optional Docker stack

新增：

```text
apps/momo/compose.observability.yaml
apps/momo/infra/observability/loki-config.yaml
apps/momo/infra/observability/alloy-config.alloy
```

该 Compose 只启动 Loki 和 Alloy。Alloy 通过 Docker discovery 查找 compose service 为 `momo` 的容器。当前文件不负责创建 Momo 容器。

运行命令单独放在 Momo scripts 中，不修改 `local:up`：

```text
pnpm logs:up
pnpm logs:down
```

## Security

- 所有日志接口使用 `createRequireFifaOwner()`。
- 查询最长 24 小时，limit 最大 200，reader 请求有固定超时。
- 不返回 Loki URL、凭证、tenant、原始错误响应和 LogQL。
- 高基数字段只参与查询，不作为 Loki label。
- 日志正文在 Momo 返回前再次脱敏，不能只依赖 Pino redact。

## Compatibility

- `/health` 保持现有响应。
- readiness 增加 `logging` 项，现有四项不改名。
- `LOG_READER_PROVIDER` 默认 `none`，不配置时现有启动方式和测试不受影响。
- 不修改数据库 schema，不生成 migration。
- Fifa 路由路径保持 `/system/operations`。

## Rollback

- 删除 Fifa 日志 Tab 和 API hook 后，readiness 与 outbox 仍可使用。
- `LOG_READER_PROVIDER=none` 可以立即关闭日志查询，不影响 Momo 其他接口。
- Loki/Alloy Compose 与业务 Compose 分开，可以单独停止和删除 volume。

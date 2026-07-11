# Momo 日志查看实现计划

## 1. Contracts

- 新增日志级别、查询、条目和列表响应 schema。
- readiness component 增加 `logging`。
- 从 contracts system 和根入口导出。
- 补 schema 测试。

## 2. Momo log fields and env

- 增加日志 reader、Loki 和 release/instance 环境变量解析。
- Pino base 增加可选 release 和 instance。
- 扩展敏感字段路径，限制外部响应正文长度。
- 补 env 和 logger 测试。

## 3. Momo LogReader

- 新增 `LogReader`、`DisabledLogReader` 和 `LokiLogReader`。
- 实现 LogQL 构造、字符串转义、Loki 请求、超时、Basic Auth 和 tenant header。
- 实现 JSON line 解析、级别转换、递归脱敏、字段截断、排序和 cursor。
- 补 reader 单元测试，使用 mock fetch，不依赖真实 Loki。

## 4. Momo system API

- `MomoRuntime` 增加 logs reader。
- readiness 增加 logging 检查。
- system service 增加日志查询和错误转换。
- system route 增加 owner-only `GET /rpc/system/logs`。
- 补 readiness、service 和 route 测试。

## 5. Fifa API and page

- 增加 logs API、query key 和 query hook。
- 将系统运行页改为三个 Tab。
- 实现快捷筛选、文本筛选、cursor 加载、刷新和详情 Drawer。
- 增加中英文文案。
- 补 API 测试和页面关键交互测试；现有页面测试框架不适合 DOM 测试时，至少覆盖 API/query 参数转换。

## 6. Optional Docker observability

- 新增 Loki 和 Alloy 配置。
- 新增独立 Compose 文件和 `logs:up`、`logs:down` 脚本。
- 校验 Compose 配置可以解析；本机没有 Docker 时如实记录未运行。

## 7. Documentation

- 更新 `apps/momo/.env.example`、Momo README 和正式文档。
- 更新 Fifa、API 和架构文档。
- 搜索旧的“Fifa 不提供原始日志读取”说明并改成当前状态。

## 8. Validation

先运行相关测试：

```bash
pnpm --filter @xdd-zone/contracts test
pnpm --filter @xdd-zone/momo test -- src/test/infra/logs src/test/modules/system src/test/infra/logger.test.ts
pnpm --filter @xdd-zone/fifa test -- src/test/api/system
```

再按顺序运行质量检查：

```bash
pnpm type-check
pnpm lint
pnpm format:check
```

最后运行：

```bash
git diff --check
docker compose -f apps/momo/compose.observability.yaml config
```

## Risk Points

- Loki query 必须由固定字段生成，不能拼接前端传入的 LogQL。
- cursor 不能包含 Loki 凭证或完整查询。
- 同一时间戳可能有多条日志，分页测试要确认不会因为排序丢失当前响应内的条目。
- Pino `level` 是数字，Loki line 解析后要转换成前端使用的字符串级别。
- readiness 调用日志服务失败时只能标记单项错误，接口本身不能返回 500。
- 页面切换 Tab 后不能继续请求不可见模块的数据。
- Alloy 的 Docker socket 只挂载到采集容器，不传给 Momo 或 Fifa。

## Implementation Result

- Contracts 增加日志查询、日志条目、cursor 响应和 readiness `logging` 类型。
- Momo 增加 `DisabledLogReader`、`LokiLogReader`、owner-only 日志接口、日志服务 readiness 和 Loki 环境变量。
- Fifa 系统运行页拆成三个 Tab，日志页支持快捷筛选、文本筛选、加载更多、详情 Drawer、复制和 Request ID 快捷筛选。
- 新增独立 Loki/Alloy Compose 配置，保留 7 天日志，不修改 `local:up`。
- 浏览器实测未登录跳转、日志禁用提示、三个 Tab、Loki 查询、日志详情、递归脱敏、Request ID 筛选和 390px 窄屏表格横向滚动。
- Momo 测试 34 个文件、287 条用例通过；Fifa 测试 15 个文件、44 条用例通过。
- `pnpm type-check`、`pnpm lint`、`pnpm format:check`、文档 Prettier 和 `git diff --check` 通过。
- Compose、Alloy `v1.17.1` 和 Loki `3.7.3` 配置校验通过。

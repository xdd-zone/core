# Momo 系统运行页实现计划

## 1. Contracts

- 新增 readiness schema 和类型。
- 新增 outbox status、query、list、detail、retry schema 和类型。
- 从 `packages/contracts/src/index.ts` 导出。
- 补 contracts schema 测试。

## 2. Momo readiness

- 给 `StorageDriver` 增加 `health()`。
- 实现 LocalStorage 和 CosStorage health。
- 更新 storage 单元测试。
- 在 system service 增加并行 readiness 检查。
- 在 system route 增加 owner-only `/rpc/system/readiness`。
- 补 service 和 route 测试，确认错误转换和权限。

## 3. Momo outbox query

- 扩展 repository：分页列表、计数、按 ID 查询。
- 新增 presenter，分别生成列表项和详情 DTO。
- 扩展 service：列表、详情、单条立即重试。
- 扩展 route：列表、详情、单条重试。
- 补 repository/service/route 测试。

## 4. Fifa API

- 扩展 system API/query，增加 readiness query。
- 扩展 events API/query，增加列表、详情和单条重试。
- 补 API 单元测试。

## 5. Fifa page

- 新增 system feature route 和 `/system/operations` 页面。
- 在 router records 注册 system routes。
- 在 navigation 增加“系统”分组。
- 增加中英文文案。
- 页面实现状态列表、筛选、表格、Drawer 和单条重试。

## 6. Documentation

- 更新 `docs/topics/api.md`。
- 更新 `docs/apps/momo.md`。
- 更新 `docs/apps/fifa.md`。
- 检查 `README.md`、`docs/architecture.md` 和目标包 README 是否有旧说明。

## 7. Validation

按顺序执行：

```bash
pnpm --filter @xdd-zone/contracts type-check
pnpm --filter @xdd-zone/momo type-check
pnpm --filter @xdd-zone/fifa type-check
pnpm --filter @xdd-zone/contracts lint
pnpm --filter @xdd-zone/momo lint
pnpm --filter @xdd-zone/fifa lint
pnpm --filter @xdd-zone/contracts format:check
pnpm --filter @xdd-zone/momo format:check
pnpm --filter @xdd-zone/fifa format:check
```

相关测试：

```bash
pnpm --filter @xdd-zone/momo test -- src/test/modules/system src/test/modules/events src/test/infra
pnpm --filter @xdd-zone/fifa test -- src/test/api/system src/test/api/events
```

最后运行：

```bash
git diff --check
pnpm type-check
pnpm lint
pnpm format:check
```

## 8. Runtime logs child task

- 子任务 `07-10-momo-log-viewer` 增加日志 contracts、`LogReader`、owner-only 日志接口和 readiness `logging` 状态。
- Fifa 系统运行页拆成“依赖状态”“后台任务”“运行日志”三个 Tab。
- 新增独立 Loki/Alloy Compose 配置，不修改 `local:up`。
- 补日志查询、分页、脱敏、错误映射和 Fifa API 测试。

## Risk Points

- COS health 必须使用 `headBucket`，不能上传测试文件。
- cache health 使用随机短 TTL key，必须在 finally 中删除。
- 单条重试必须只处理指定 ID，不能调用批量 `retryPending()`。
- route 顺序中 `/:eventId` 不能拦截 `/retry`。
- outbox payload 在列表接口中不返回，只在详情接口返回。

## Result

- readiness、outbox 和运行日志两阶段代码、测试和正式文档已完成。
- Momo 测试：34 个文件，287 条通过。
- Fifa 测试：15 个文件，44 条通过。
- `pnpm type-check`、`pnpm lint`、`pnpm format:check` 通过。
- Fifa 生产构建通过。
- 浏览器确认未登录跳转、三个 Tab、日志禁用提示、实际日志查询、详情脱敏、Request ID 筛选和 390px 窄屏表格横向滚动。
- Docker Compose、Alloy `v1.17.1` 和 Loki `3.7.3` 配置校验通过。
- 功能提交为 `d391350` 和 `6289ace`；日志子任务已归档。

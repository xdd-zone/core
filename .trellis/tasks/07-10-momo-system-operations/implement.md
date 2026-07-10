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

## Risk Points

- COS health 必须使用 `headBucket`，不能上传测试文件。
- cache health 使用随机短 TTL key，必须在 finally 中删除。
- 单条重试必须只处理指定 ID，不能调用批量 `retryPending()`。
- route 顺序中 `/:eventId` 不能拦截 `/retry`。
- outbox payload 在列表接口中不返回，只在详情接口返回。

## Result

- 第一阶段代码、测试和正式文档已完成。
- Momo 测试：32 个文件，269 条通过。
- Fifa 测试：14 个文件，43 条通过。
- `pnpm type-check`、`pnpm lint`、`pnpm format:check` 通过。
- Fifa 生产构建通过。
- 浏览器确认 `/system/operations` 未登录时跳转 `/login`。当前浏览器没有 Fifa 登录态，因此没有代替用户输入账号密码。
- 第二阶段 Loki 或托管日志服务接入保留为后续独立任务。

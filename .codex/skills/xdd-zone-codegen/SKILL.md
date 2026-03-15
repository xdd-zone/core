---
name: xdd-zone-codegen
description: 为 XDD Zone Core 生成或修改标准代码。用于当前仓库内新增或调整 Elysia-first 的 route、module、schema、client accessor、权限相关代码时，保持目录结构、命名、JSDoc、响应格式、apiDetail 与导出方式一致，避免风格漂移。
---

# XDD Zone Codegen

当用户要在当前仓库新增接口、模块、契约或 SDK 访问器，或者明确要求“按 XDD Zone 风格生成代码”时，使用这个 Skill。

## 先做什么

先读取这些文档：

- `README.md`
- `docs/architecture.md`
- `docs/development.md`
- 目标包的 `README.md`

然后打开最接近的现有实现作为参考：

- route 参考 `packages/nexus/src/routes/user.route.ts`
- module 参考 `packages/nexus/src/modules/user/`
- schema 参考 `packages/schema/src/contracts/user/`
- client 参考 `packages/client/src/modules/user/index.ts`

如果是 RBAC / 权限接口，优先参考 `packages/nexus/src/routes/rbac.route.ts` 与 `packages/nexus/src/modules/rbac/`。

## 不可偏离的规则

- `packages/schema` 是唯一契约源。先定义或修改 schema，再写服务端和 client。
- `packages/nexus/src/routes/*.route.ts` 只负责 route、schema、plugin、`apiDetail(...)` 和调用 service。
- `packages/nexus/src/modules/*` 承载业务逻辑；涉及 Prisma 访问时优先落到 repository。
- 成功响应直接返回业务数据，不包一层 `{ code, message, data }`。
- 删除或无 body 操作返回 `204`。
- 错误交给统一错误处理；缺失资源优先抛 `NotFoundError`。
- Nexus 侧优先使用 `@/` 别名导入。
- 导出函数、类、方法补齐中文 JSDoc；避免 `any`。
- 命名和文件名遵循现有约定：camelCase / PascalCase / UPPER_SNAKE_CASE / kebab-case。

## 类型安全底线

- 禁止写 `any`、`as any`、`Array<any>`、`Promise<any>`、`Record<string, any>`。
- 每个类型都要表达业务含义，优先使用 `UserListQuery`、`CreateRoleBody`、`RoleDetail`、`UserWhereInput` 这类语义化名称，避免空泛的 `Data`、`Result`、`Payload`。
- route 的 `body / query / params / response` 类型优先从 `packages/schema` 的 Zod schema 推导。
- repository 的输入输出优先复用 Prisma 生成类型、`WhereInput`、`Select`、`GetPayload` 或模块内显式定义的 `*.types.ts`。
- service 的方法签名必须写清楚入参与返回值，不能把 `Promise` 返回值留成隐式宽类型。
- client 的请求体和响应体必须绑定 schema parse 与明确的返回类型，不能靠宽泛对象兜底。
- 真正动态的数据先用 `unknown`，再通过 schema、类型守卫或字段收窄转换；不要直接退回 `any`。
- 如果一个对象暂时无法精确定义，就先在 `*.types.ts` 或 `*.model.ts` 给它起一个有意义的名字，再继续写逻辑。

## 类型来源优先级

按下面顺序找类型来源，只有前一层无法表达时才进入下一层：

1. `packages/schema` 的 `z.infer`、`_input`、`_output`
2. Prisma 生成类型和 `select` 对应的 payload 类型
3. 现有基础泛型，例如 `PaginatedList<T>`、`PaginationQuery`、`RequestFn`
4. 模块内新增的语义化 `type` / `interface`

不要为了省事跳过前两层，直接写宽泛对象类型。

## 生成顺序

1. 在 `packages/schema` 定义 `body / query / params / response` schema，并更新对应 `index.ts`
2. 在 `packages/nexus/src/modules/<name>/` 实现 `model / service / repository / types / constants / index`
3. 在 `packages/nexus/src/routes/*.route.ts` 注册接口，并按需更新 `packages/nexus/src/routes/index.ts`
4. 如果该能力需要通过 SDK 暴露，再补 `packages/client/src/modules/<name>/index.ts`
5. 检查是否需要补充文档或导出

如果用户只要求后端内部能力，不要默认新增 client 访问器。

## plugin 选择

- 公开接口：`authPlugin`
- 仅要求登录：`protectedPlugin`
- 需要权限判断：`permissionPlugin`

常见权限写法：

- `permit.permission(...)`
- `permit.own(...)`
- `permit.me(...)`

## OpenAPI 与响应约定

- route detail 统一走 `apiDetail(...)`
- 列表分页结构固定为 `items / total / page / pageSize / totalPages`
- `204` 接口只设置 `set.status = 204`

## 生成前检查

在真正写代码前，先判断这次改动是否需要同时更新以下层：

- `packages/schema`
- `packages/nexus`
- `packages/client`
- `docs`

涉及公共 API 的新增或变更，默认同时检查这三层是否一致。

## 收尾检查

完成代码后，再做一次类型安全自检：

- 搜索是否残留 `any` 或 `as any`
- 检查导出类型名是否表达业务语义
- 检查 route / service / repository / client 的返回值是否明确
- 检查动态数据是否经过 schema parse 或显式收窄

如果出现“先写 `any`，后面再改”的冲动，直接停下来补类型，不要把这个债留给后续修改。

## 模板与清单

创建新模块或新接口时，打开 `references/patterns.md`，按其中的骨架与检查清单生成，避免漏掉导出、路由聚合、分页 schema 或 client accessor。

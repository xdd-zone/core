# 项目 Skill

仓库提供一个项目级 Skill，用于在 AI 生成代码时保持 XDD Zone Core 的风格一致。

## xdd-zone-codegen

位置：

`../.codex/skills/xdd-zone-codegen/SKILL.md`

适用场景：

- 新增或修改 `packages/nexus` 内的接口定义
- 新增或修改 `packages/nexus` 的 route / module / repository / service
- 明确要求“按 XDD Zone Core 风格生成代码”

这个 Skill 约束 AI 按项目的 Elysia-first 风格工作，核心要求包括：

- 先定义接口，再实现 nexus
- route 保持轻量，只负责 HTTP 结构与 service 调用
- service 负责业务编排，repository 负责 Prisma 访问
- 禁止用 `any` 兜底，类型必须来自接口定义、Prisma 或语义化模块类型
- 成功响应直接返回业务数据
- 删除类接口返回 `204`
- OpenAPI 统一使用 `apiDetail(...)`
- 命名、导出、JSDoc、分页结构与现有代码保持一致

## 使用前建议

触发这个 Skill 前，先看：

1. [README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [development.md](./development.md)
4. 目标包 README

最常用的参考实现：

- [user.route.ts](../packages/nexus/src/routes/user.route.ts)
- [user.service.ts](../packages/nexus/src/modules/user/user.service.ts)
- [user.contract.ts](../packages/nexus/src/modules/user/user.contract.ts)

## 维护建议

如果后续项目结构或风格发生变化，更新下面两处即可：

- Skill 本体：`../.codex/skills/xdd-zone-codegen/`
- 项目说明：`../AGENTS.md`

# 项目 Skill

仓库提供项目级 Skill，用于在 AI 生成代码时保持 XDD Zone Core 的风格一致。

## xdd-zone-codegen

位置：

`../.codex/skills/xdd-zone-codegen/SKILL.md`

适用场景：

- 新增或修改 `packages/nexus` 内的接口定义
- 新增或修改 `packages/nexus` 的模块、service、repository
- 明确要求“按 XDD Zone Core 风格生成代码”

这个 Skill 的核心要求：

- 先定义模块 `model.ts`
- 再实现 `service / repository`
- 在模块 `index.ts` 注册路由
- route 保持轻量，只负责 HTTP 结构与 service 调用
- service 负责业务编排，repository 负责 Prisma 访问
- 禁止用 `any` 兜底
- 成功响应直接返回业务数据
- 删除类接口返回 `204`
- OpenAPI 统一使用 `apiDetail(...)`

## 触发前必须先看

触发这个 Skill 前，必须先看：

1. [README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [development.md](./development.md)
4. 目标包 README

最常用的参考实现：

- [user/index.ts](../packages/nexus/src/modules/user/index.ts)
- [user/service.ts](../packages/nexus/src/modules/user/service.ts)
- [user/model.ts](../packages/nexus/src/modules/user/model.ts)

## 维护建议

如果后续项目结构或风格发生变化，更新下面两处即可：

- Skill 本体：`../.codex/skills/xdd-zone-codegen/`
- 项目说明：`../AGENTS.md`

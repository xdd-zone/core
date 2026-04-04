# 项目 Skill

仓库提供项目级 Skill，用于让 AI 快速建立当前项目上下文，并在生成代码时保持 XDD Zone Core 的结构和风格一致。

## xdd-zone-codegen

位置：

`../.codex/skills/xdd-zone-codegen/SKILL.md`

适用场景：

- 新会话刚进入当前仓库，需要先判断这次任务该读哪些文档、该看哪几层代码
- 用户先说“先看看这个仓库”“这次该从哪改”“先帮我定位相关文档和代码入口”
- 用户想先判断这次需求该走 `packages/nexus`、`packages/console`、文案，还是前后端联动
- 新增或修改 `packages/nexus` 内的接口定义
- 新增或修改 `packages/nexus` 的模块、service、repository
- 新增或修改 `packages/console` 的页面、路由、导航、布局、认证联调
- 处理认证、RBAC、GitHub 登录、Eden、OpenAPI 或前后端联调问题
- 明确要求“按 XDD Zone Core 风格生成代码”

这个 Skill 的核心要求：

- 先把任务分流到正确的文档、代码目录和前置技能
- 先判断是否需要补调用 `elysiajs`、`frontend-design`、`write-xdd-docs`
- 如果用户只是想先判断落点，先完成分流，不默认直接写代码
- 进入 Nexus 实现时，先定义模块 `model.ts`
- 再实现 `service / repository`
- 在模块 `index.ts` 注册路由
- Console 直接复用 Eden Treaty、现有路由、导航、layout 和 access-control
- route 保持轻量，只负责 HTTP 结构与 service 调用
- service 负责业务编排，repository 负责 Prisma 访问
- 禁止用 `any` 兜底
- 成功响应直接返回业务数据
- 删除类接口返回 `204`
- OpenAPI 统一使用 `apiDetail(...)`

## 触发前必须先看

触发这个 Skill 前，必须先看：

1. [README.md](../README.md)
2. [index.md](./index.md)
3. [architecture.md](./architecture.md)
4. [development.md](./development.md)
5. 目标包 README

最常用的参考实现：

- [user/index.ts](../packages/nexus/src/modules/user/index.ts)
- [user/service.ts](../packages/nexus/src/modules/user/service.ts)
- [user/model.ts](../packages/nexus/src/modules/user/model.ts)
- [routes.tsx](../packages/console/src/app/router/routes.tsx)
- [navigation.ts](../packages/console/src/app/navigation/navigation.ts)
- [eden.ts](../packages/console/src/shared/api/eden.ts)

## 维护建议

如果后续项目结构或风格发生变化，更新下面两处即可：

- Skill 本体：`../.codex/skills/xdd-zone-codegen/`
- 项目文档：`./index.md`、`./skills.md`
- 项目说明：`../AGENTS.md`

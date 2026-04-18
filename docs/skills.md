# 常用技能

这份文档只写当前仓库最常用的几个技能和使用顺序。

## 先定位任务落点

如果你刚进仓库，还不确定要改哪里，先用：

- `xdd-zone-codegen`

它适合这些场景：

- 想先看仓库结构
- 想先定位相关文档和代码入口
- 不确定该改 `packages/nexus` 还是 `packages/console`
- 想按当前仓库方式继续实现

## 按任务类型继续补技能

### 改说明性文案

先用：

- `write-docs`

### 改 `packages/nexus`

先用：

- `elysiajs`

### 改 `packages/console` 页面、布局、导航

先看：

- `packages/console/design-context.md`

再用：

- `frontend-design`

## 常用顺序

- 文档任务：`write-docs` -> `xdd-zone-codegen`
- Nexus 任务：`elysiajs` -> `xdd-zone-codegen`
- Console UI 任务：`frontend-design` -> `xdd-zone-codegen`
- Console UI + 文案任务：`frontend-design` -> `write-docs` -> `xdd-zone-codegen`

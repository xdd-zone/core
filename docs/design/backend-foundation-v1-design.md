# 后台底座优先 V1 设计文档

## 1. 设计原则

本次设计采用以下原则：

1. 先做稳定底座，再做业务扩展。
2. 权限表达能力，资源归属表达业务规则。
3. 固定角色优先，动态配置延后。
4. 删除旧实现，不做兼容层。
5. 文档、模型、接口、权限语义必须一致。

## 2. 领域边界

### 2.1 身份域 Identity

职责：

- 识别用户身份
- 管理登录与会话
- 管理平台级基础资料

模型：

- `User`
- `Account`
- `Session`
- `Verification`

约束：

- `User` 只保留平台级资料。
- 不在 `User` 中承载博客、项目、文章等业务属性。
- 用户状态与删除语义明确区分。
- 当前用户资料通过 `/api/user/me` 收口，管理员资料管理通过 `/api/user` 与 `/api/user/:id` 收口。

### 2.2 访问控制域 Access

职责：

- 表达角色
- 表达权限
- 维护用户与角色关系
- 维护角色与权限关系

模型：

- `Role`
- `Permission`
- `UserRole`
- `RolePermission`

约束：

- `Role` 在 V1 中只作为固定系统角色容器。
- `Permission` 在 V1 中只作为代码驱动的权限注册表。
- 不在 V1 中启用角色继承、角色树、组织关系。
- `Role` 只保留 `superAdmin / admin / user` 三个系统角色。

### 2.3 业务模块域 Module

职责：

- 承载博客、项目、内容等未来业务
- 自己维护资源所有权与业务规则

原则：

- 模块自己决定 `ownerId / authorId / createdBy`
- 权限系统只判断“是否具备能力”
- 资源是否属于当前用户，必须由模块自行判断

## 3. 模型设计

### 3.1 User

建议保留字段：

- `id`
- `email`
- `username`
- `name`
- `image`
- `phone`
- `introduce`
- `emailVerified`
- `emailVerifiedAt`
- `phoneVerified`
- `phoneVerifiedAt`
- `lastLogin`
- `lastLoginIp`
- `status`
- `deletedAt`
- `createdAt`
- `updatedAt`

设计说明：

- `introduce` 定义为平台资料简介，不定义为作者业务简介。
- `deletedAt` 作为归档语义保留，但常规管理动作不以硬删除为默认方案。

### 3.2 Role

V1 建议保留字段：

- `id`
- `name`
- `displayName`
- `description`
- `isSystem`
- `createdAt`
- `updatedAt`

V1 建议移除或停用字段语义：

- `parentId`
- `level`

原因：

- 当前阶段没有真实的角色树需求。
- 角色继承会显著放大缓存、变更影响、测试复杂度。
- 该能力对“后台底座优先”阶段收益不足。

### 3.3 Permission

V1 继续沿用当前 `resource + action + scope` 模式，但收紧使用规则。

要求：

- `scope` 仅使用明确语义，不再混用大量空作用域和预留语义。
- 权限由代码常量和 seed 同步生成。
- 不在 V1 中开放运行时权限创建、编辑、删除。

### 3.4 UserRole

保留字段：

- `id`
- `userId`
- `roleId`
- `assignedBy`
- `assignedAt`

要求：

- `assignedBy` 从本次开始应写入真实授权人。
- 用户角色分配是后台管理的核心动作之一。

### 3.5 RolePermission

职责：

- 固定角色与固定权限的映射表

要求：

- V1 仅由 seed 或代码同步更新
- 不对外开放动态编辑入口

## 4. 权限设计

## 4.1 设计原则

- `Permission` 表达能力
- `Ownership` 表达归属
- `Route Guard` 不应伪装成通用资源归属判断器

结论：

- 当前 `own` 机制只适用于用户自己资料类接口
- 未来业务资源不可复用“参数等于用户 ID”式 own 判断

### 4.2 最小权限集

V1 固定权限如下：

- `user:read:own`
- `user:update:own`
- `user:read:all`
- `user:update:all`
- `user:disable:all`
- `role:read:all`
- `user_role:assign:all`
- `user_role:revoke:all`
- `user_permission:read:own`
- `user_permission:read:all`
- `system:manage`

### 4.3 固定角色映射

`superAdmin`

- 直接拥有平台全部能力
- 建议在代码层做显式超级管理员放行，而不是依赖 seed 时的权限快照

`admin`

- `user:read:all`
- `user:update:all`
- `user:disable:all`
- `role:read:all`
- `user_role:assign:all`
- `user_role:revoke:all`
- `user_permission:read:all`
- 用于后台管理能力，不承载超级管理员语义。

`user`

- `user:read:own`
- `user:update:own`
- `user_permission:read:own`
- 用于普通登录用户的自助资料能力。

## 5. 接口设计收口

### 5.1 V1 保留接口

- 注册、登录、登出、获取会话
- 当前用户资料查询与更新
- 用户列表、用户详情、用户更新、用户状态管理
- 当前用户角色、当前用户权限
- 查看指定用户角色、查看指定用户权限
- 为用户分配角色、移除角色
- 角色列表

### 5.2 V1 移除接口

- 角色创建
- 角色更新
- 角色删除
- 角色层级管理
- 动态权限创建
- 动态权限更新
- 动态权限删除
- 角色权限动态分配与替换

## 6. 用户生命周期设计

推荐语义：

- `ACTIVE`：正常使用
- `INACTIVE`：停用/未启用
- `BANNED`：封禁

补充说明：

- 常规后台管理不提供硬删除入口
- 需要归档时使用 `deletedAt`
- 若保留 `deletedAt`，则查询与唯一性约束必须与之同步

## 7. 清理策略

本次采用“直接移除，不兼容”的清理策略。

需要清理的内容包括：

- 与角色继承相关的模型语义、接口、服务逻辑、缓存逻辑
- 与动态权限平台相关的路由、服务和文案
- 与硬删除默认语义相关的实现与文案
- 与最小权限集不一致的旧权限常量和 seed
- 与本次目标冲突的旧说明文字

## 8. 风险与控制

风险：

- 直接移除旧能力会造成现有调用失效
- 权限收口会影响现有调试入口
- 用户删除语义调整会影响已有实现

控制方式：

- 以本次设计文档为唯一目标基线
- 文档、实现、验收同时更新
- 不做兼容分支，避免语义继续漂移

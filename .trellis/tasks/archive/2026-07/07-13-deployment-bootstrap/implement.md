# Docker 凭证与 owner 初始化实施清单

## 实现

- [x] 新增可执行的 `docker/deploy.sh`，检查 Docker/Compose，安全创建新 `docker/.env`，保留已有文件，校验必需值，执行 Compose，处理失败日志并显示本次生成的凭证。
- [x] 修改 `docker/.env.example`，把本地可生成凭证改为空值，把 OAuth 变量改为成对可选，增加可选 owner email 和显示名。
- [x] 修改 `docker/compose.yaml`，继续使用已有 `DATABASE_URL`，对必需凭证使用 Compose 缺失检查，新增 `momo-bootstrap`，并让 Momo 等待 migration 和 owner 初始化成功。
- [x] 修改 `apps/momo/src/scripts/seed-owner.ts`，先识别现有 `fifa.owner`；新建时使用 Better Auth 和随机密码，已存在时不修改密码、资料或首次内容。
- [x] 修改 `apps/momo/src/shared/env.ts` 和 `apps/momo/src/modules/auth/auth.config.ts`，把 GitHub/Google OAuth 改为成对可选，并把历史 `replace-with-*` 值按未配置处理。
- [x] 更新 `apps/momo/.env.example`，说明 owner 密码可留空并自动生成。
- [x] 修改 Momo 环境变量测试，覆盖 OAuth 全空、成对配置、历史占位值和只配置一半的情况。
- [x] 根据现有测试结构为 owner 判断和密码生成补充最小可维护的回归测试；如果脚本结构不适合导入，以隔离 Docker 首次/更新验证覆盖该行为，不为测试强行新增抽象。
- [x] 把根 `package.json` 的 `docker:up` 改为调用 `./docker/deploy.sh`，其他停止、依赖服务和日志命令继续复用同一 Compose 文件。

## 文档

- [x] 修改 `README.md` 的 Docker 首次部署、更新部署、凭证显示和 volume 保护说明。
- [x] 修改 `docs/development.md`，把 `./docker/deploy.sh` 写为唯一正式入口，说明 `.env` 的首次生成和更新保留行为。
- [x] 修改 `docs/apps/momo.md` 和 `apps/momo/README.md`，说明 Docker owner 初始化、默认 email、一次性密码、已有 owner 处理和 OAuth 可选规则。
- [x] 搜索 `docs/integrations/` 中 GitHub/Google OAuth 环境变量说明，只修改与本次可选启用行为直接相关的段落。
- [x] 实现和检查完成后运行 `trellis-update-spec`，判断并更新 `.trellis/spec/momo/backend/docker.md` 中的部署入口、凭证和 owner 启动顺序。

## 验证

1. [x] 运行 `pnpm --dir apps/momo test`。
2. [x] 运行 `pnpm type-check`。
3. [x] 运行 `pnpm lint`。
4. [x] 运行 `pnpm format:check`。
5. [x] 运行 `sh -n docker/deploy.sh`。
6. [x] 使用已有 `docker/.env` 运行 `docker compose --env-file docker/.env -f docker/compose.yaml config`。
7. [x] 在临时仓库副本中把 Compose 资源名和宿主机端口改为专用测试值，再执行首次部署，确认自动生成凭证、`.env` 权限、migration、owner 创建、管理员登录和三个应用健康状态。
8. [x] 记录临时 `.env` 的校验值，再次执行同一部署命令，确认文件内容不变、owner 仍可登录、不重复显示密码。
9. [x] 使用临时环境制造 OAuth 半配置和 owner 初始化失败，确认部署命令返回非零状态且 Momo 不启动。
10. [x] 只删除临时 project 的容器、network、volume 和镜像，不对现有 `xdd-core` volume 执行 `down --volumes`。
11. [x] 对改动的 Markdown 运行 `pnpm exec prettier --check <files>`，再运行 `git diff --check`。

## 风险与停止点

- 旧 `.env` 可能保留弱示例凭证。本任务只警告，不自动轮换；轮换 PostgreSQL 密码需要单独任务。
- owner 密码只显示一次。如果部署人没有保存，本任务不提供自动找回。
- 如果 Compose 版本不支持设计中使用的等待参数，停在版本检查，不在未确认的情况下更换启动方式。
- 隔离首次部署验证如果无法保证不使用现有 volume，停止该验证，不冒险清理现有数据。

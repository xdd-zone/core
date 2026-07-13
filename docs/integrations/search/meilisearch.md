# Meilisearch 搜索

当前 `apps/momo` 已经接入搜索驱动层。可以关闭搜索，也可以连接本地 Meilisearch。公开搜索接口是 `GET /rpc/bobo/search?q=关键词`。文章和项目发布后会写入 `site` 索引。

## 代码位置

- 搜索接口类型放在 `apps/momo/src/infra/search/search.types.ts`。
- 禁用搜索驱动放在 `apps/momo/src/infra/search/disabled-search.ts`。
- Meilisearch 搜索驱动放在 `apps/momo/src/infra/search/meilisearch-search.ts`。
- `createRuntime()` 会创建 `runtime.search`。
- 搜索业务入口放在 `apps/momo/src/modules/search`。

## 本地服务

本地 Docker 配置放在：

```text
docker/compose.yaml
```

启动服务：

```bash
pnpm docker:deps:up
```

Meilisearch 本地地址：

```text
http://localhost:57700
```

本地 master key：

```text
momo-meilisearch-development-master-key
```

## 环境变量

默认关闭搜索：

```text
SEARCH_PROVIDER=none
```

连接本地 Meilisearch：

```text
SEARCH_PROVIDER=meilisearch
MEILI_HOST=http://localhost:57700
MEILI_API_KEY=momo-meilisearch-development-master-key
MEILI_INDEX_PREFIX=momo
```

`SEARCH_PROVIDER=meilisearch` 时，`MEILI_HOST` 和 `MEILI_API_KEY` 必须配置。

`MEILI_INDEX_PREFIX` 默认是 `momo`。调用方传逻辑索引名，例如 `posts`，驱动实际访问 `momo_posts`。

## 当前限制

- 当前没有 reindex 脚本。
- 当前在发布文章和项目时写入索引，归档文章和项目时会删除对应索引文档。
- PostgreSQL 仍然保存业务数据。Meilisearch 只保存搜索要用的数据副本。

# Momo Logging Guidelines

## Structured Output

Momo uses Pino and writes JSON logs to stdout. Do not write general runtime logs to PostgreSQL or read local log files from an API route.

Base fields:

- Required: `service`, `env`.
- Optional: `release`, `instance`.
- Runtime events: `module`, `event`, `requestId`, `path`, `status`, `durationMs`, `errorName`, `errorCode`, `errorMessage`.
- Do not log credentials, cookies, authorization headers, tokens, raw request bodies, or unknown upstream response bodies.

## Scenario: Query Momo Logs Through Fifa

### 1. Scope / Trigger

Use this contract when Fifa needs to query Momo runtime logs. Loki stays behind Momo: Fifa calls the owner-only Momo API and never stores a Loki URL, credential, tenant ID, or LogQL expression.

### 2. Signatures

```typescript
interface LogReader {
  readonly enabled: boolean
  readonly provider: string
  health(): Promise<{ status: 'disabled' | 'ready' }>
  query(input: ResolvedSystemLogQuery): Promise<{
    from: string
    logs: SystemLogEntry[]
    nextCursor: string | null
    to: string
  }>
}
```

```text
GET /rpc/system/readiness
GET /rpc/system/logs
```

Both routes require `fifa.owner`. The logs route validates with `SystemLogListQuerySchema`, resolves the time window in `system.service.ts`, and calls `runtime.logs.query()`.

### 3. Contracts

Query fields:

- Time: `rangeMinutes` defaults to `60`, or provide `from` and `to` together as ISO timestamps.
- Filters: `minLevel`, `module`, `event`, `requestId`, `path`, `statusFrom`, `statusTo`, `minDurationMs`.
- Pagination: `cursor` is opaque; `limit` defaults to `100` and cannot exceed `200`.
- Maximum time window: 24 hours.

Response fields:

- Page: `from`, `to`, `queriedAt`, `logs`, `nextCursor`.
- Entry: `id`, `timestamp`, `level`, `message`, fixed request/error fields, and sanitized `context`.
- `service` is always `momo`.

Environment variables:

| Key                              | Rule                                 |
| -------------------------------- | ------------------------------------ |
| `LOG_READER_PROVIDER`            | `none` or `loki`; defaults to `none` |
| `LOKI_URL`                       | Required when provider is `loki`     |
| `LOKI_USERNAME`, `LOKI_PASSWORD` | Configure both or neither            |
| `LOKI_TENANT_ID`                 | Optional `X-Scope-OrgID` value       |
| `LOG_QUERY_TIMEOUT_MS`           | Defaults to `5000`                   |
| `APP_RELEASE`, `APP_INSTANCE_ID` | Optional Pino base fields            |

`LokiLogReader` builds LogQL from the fixed query fields. Never accept a selector, pipeline, file path, or arbitrary LogQL from the client.

### 4. Validation & Error Matrix

| Condition                                             |          HTTP | Biz code / behavior       |
| ----------------------------------------------------- | ------------: | ------------------------- |
| Missing owner session or role                         | `401` / `403` | Existing Fifa owner guard |
| Only one of `from` / `to` is present                  |         `400` | `COMMON.INVALID_REQUEST`  |
| `from` is later than `to`                             |         `400` | `COMMON.INVALID_REQUEST`  |
| Window exceeds 24 hours                               |         `400` | `COMMON.INVALID_REQUEST`  |
| `statusFrom` is greater than `statusTo`               |         `400` | `COMMON.INVALID_REQUEST`  |
| Invalid cursor                                        |         `400` | `COMMON.INVALID_REQUEST`  |
| Provider is disabled                                  |         `503` | `SYSTEM.LOGS_DISABLED`    |
| Loki is unavailable or returns an unsupported payload |         `503` | `SYSTEM.LOGS_UNAVAILABLE` |
| Loki request times out                                |         `504` | `SYSTEM.UPSTREAM_TIMEOUT` |

Do not return Loki URLs, credentials, raw error responses, or generated LogQL in an API error.

### 5. Good / Base / Bad Cases

- Good: `LOG_READER_PROVIDER=loki` with a reachable Loki returns sanitized entries in reverse timestamp order and an opaque cursor.
- Base: `LOG_READER_PROVIDER=none` keeps Momo operational; readiness reports `logging=disabled`, and Fifa does not request `/rpc/system/logs`.
- Bad: a query longer than 24 hours fails before calling Loki.
- Bad: nested keys containing password, token, cookie, authorization, API key, or secret are returned as `[已隐藏]`.
- Bad: long strings, arrays, object key counts, and nesting depth are truncated before returning data to Fifa.

### 6. Tests Required

- Contracts: defaults, coercion, ISO timestamp validation, `limit <= 200`, and filter length/range limits.
- Reader: LogQL escaping, auth headers, tenant header, timeout, invalid payload, multi-stream merge, descending order, same-timestamp cursor behavior, sanitization, and truncation.
- Service/route: owner guard, cross-field validation, disabled/unavailable/timeout error mapping, and readiness `logging` status.
- Fifa API: query serialization, cursor forwarding, and disabled readiness preventing a logs request.
- Compose: `docker compose -f apps/momo/compose.observability.yaml config` plus Loki and Alloy config validation.

### 7. Wrong vs Correct

#### Wrong

```typescript
const query = c.req.query('logql')
return fetch(`${lokiUrl}/loki/api/v1/query_range?query=${query}`)
```

This lets the browser select arbitrary streams and couples Fifa to Loki.

#### Correct

```typescript
const input = c.req.valid('query')
const result = await getSystemLogs(runtime, input)
return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
```

Momo validates platform-neutral fields and the reader generates the restricted LogQL.

## Common Mistake: Complex Effects in the RPC Query Schema

Do not add `superRefine()`, `refine()`, or another complex `ZodEffects` chain to `SystemLogListQuerySchema`. Hono RPC declaration generation can exceed TypeScript's type-instantiation depth.

Keep field-level limits in the shared schema. Put cross-field checks such as `from/to`, time-window length, and status ordering in `apps/momo/src/modules/system/system.service.ts`, with route/service tests for every failure.

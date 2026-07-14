#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(dirname "$SCRIPT_DIR")
ENV_FILE="$SCRIPT_DIR/.env"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
COMPOSE_FILE="$SCRIPT_DIR/compose.yaml"
TEMP_ENV=''
NEW_ENV=0

POSTGRES_PASSWORD=''
BETTER_AUTH_SECRET=''
MEILI_API_KEY=''
BOBO_REVALIDATE_SECRET=''
LLM_SECRET_KEY=''

cleanup() {
  if [ -n "$TEMP_ENV" ] && [ -f "$TEMP_ENV" ]; then
    rm -f "$TEMP_ENV"
  fi
}

trap cleanup EXIT HUP INT TERM

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

random_hex() {
  od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
}

random_base64() {
  dd if=/dev/urandom bs=32 count=1 2>/dev/null | base64 | tr -d '\r\n'
}

read_env_value() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1
}

replace_env_value() {
  key=$1
  value=$2
  sed "s|^${key}=.*|${key}=${value}|" "$TEMP_ENV" >"${TEMP_ENV}.next"
  mv "${TEMP_ENV}.next" "$TEMP_ENV"
}

require_env_value() {
  key=$1
  value=$(read_env_value "$key")

  if [ -z "$value" ]; then
    fail "docker/.env 中的 $key 未设置。补全该变量后重新执行 ./docker/deploy.sh。"
  fi
}

warn_weak_value() {
  key=$1
  value=$(read_env_value "$key")

  case "$value" in
    momo | momo-meilisearch-development-master-key | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= | replace-with-*)
      printf '%s\n' "警告: docker/.env 中的 $key 仍是示例值，本次不会自动替换。" >&2
      ;;
  esac
}

command -v docker >/dev/null 2>&1 || fail '没有找到 Docker。安装 Docker 和 Docker Compose 后重新执行 ./docker/deploy.sh。'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose 不可用。安装 Docker Compose v2 后重新执行 ./docker/deploy.sh。'

if [ -L "$ENV_FILE" ]; then
  fail 'docker/.env 不能是符号链接。请改成普通文件后重新执行 ./docker/deploy.sh。'
fi

if [ ! -f "$ENV_FILE" ]; then
  [ -f "$ENV_EXAMPLE" ] || fail '没有找到 docker/.env.example，无法创建 docker/.env。'

  umask 077
  TEMP_ENV="$ENV_FILE.tmp.$$"
  cp "$ENV_EXAMPLE" "$TEMP_ENV"

  POSTGRES_PASSWORD=$(random_hex)
  BETTER_AUTH_SECRET=$(random_hex)
  MEILI_API_KEY=$(random_hex)
  BOBO_REVALIDATE_SECRET=$(random_hex)
  LLM_SECRET_KEY=$(random_base64)

  replace_env_value POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
  replace_env_value DATABASE_URL "postgres://momo:${POSTGRES_PASSWORD}@postgres:5432/momo"
  replace_env_value BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET"
  replace_env_value MEILI_API_KEY "$MEILI_API_KEY"
  replace_env_value BOBO_REVALIDATE_SECRET "$BOBO_REVALIDATE_SECRET"
  replace_env_value LLM_SECRET_KEY "$LLM_SECRET_KEY"

  mv "$TEMP_ENV" "$ENV_FILE"
  TEMP_ENV=''
  chmod 600 "$ENV_FILE"
  NEW_ENV=1
else
  chmod 600 "$ENV_FILE"
fi

for key in POSTGRES_PASSWORD DATABASE_URL BETTER_AUTH_SECRET MEILI_API_KEY BOBO_REVALIDATE_SECRET LLM_SECRET_KEY; do
  require_env_value "$key"
done

if [ "$NEW_ENV" -eq 0 ]; then
  for key in POSTGRES_PASSWORD BETTER_AUTH_SECRET MEILI_API_KEY BOBO_REVALIDATE_SECRET LLM_SECRET_KEY; do
    warn_weak_value "$key"
  done
fi

cd "$REPO_DIR"

compose config >/dev/null

if ! compose up -d --build --wait; then
  printf '%s\n' 'Docker 部署失败。下面是 migration 和 owner 初始化日志：' >&2
  compose logs --no-color momo-migrate momo-bootstrap >&2 || true
  exit 1
fi

bootstrap_logs=$(compose logs --no-color momo-bootstrap)
compose rm -f momo-bootstrap >/dev/null

printf '%s\n' "$bootstrap_logs" | sed -n \
  -e 's/^.* | //' \
  -e '/^XDD_OWNER_EMAIL=/p' \
  -e '/^XDD_OWNER_PASSWORD=/p'

if [ "$NEW_ENV" -eq 1 ]; then
  printf '%s\n' '本次生成的服务凭证：'
  printf '%s\n' "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
  printf '%s\n' "BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET"
  printf '%s\n' "MEILI_API_KEY=$MEILI_API_KEY"
  printf '%s\n' "BOBO_REVALIDATE_SECRET=$BOBO_REVALIDATE_SECRET"
  printf '%s\n' "LLM_SECRET_KEY=$LLM_SECRET_KEY"
fi

printf '%s\n' 'Docker 服务已启动。'

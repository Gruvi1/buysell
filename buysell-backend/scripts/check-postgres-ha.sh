#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-buysell-ha-smoke}"
KEEP_CLUSTER="${KEEP_CLUSTER:-0}"
KEEP_ON_FAILURE="${KEEP_ON_FAILURE:-1}"
RESET_CLUSTER="${RESET_CLUSTER:-1}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-kira}"
SQL_CONNECT_TIMEOUT="${SQL_CONNECT_TIMEOUT:-3}"
SQL_EXEC_TIMEOUT="${SQL_EXEC_TIMEOUT:-15}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180}"
DIAGNOSTICS_AFTER="${DIAGNOSTICS_AFTER:-30}"
LOG_FILE="${LOG_FILE:-logs/postgres-ha-smoke.log}"
LOG_TO_CONSOLE="${LOG_TO_CONSOLE:-0}"
NETWORK_NAME="${DOCKER_NETWORK_NAME:-${PROJECT_NAME}_pg-ha}"
POSTGRES_CLIENT_IMAGE="${POSTGRES_CLIENT_IMAGE:-buysell-pacemaker-postgres:local}"
PGBOUNCER_SQL_HOST="${PGBOUNCER_SQL_HOST:-172.30.0.30}"
PGBOUNCER_SQL_PORT="${PGBOUNCER_SQL_PORT:-6432}"
ROUTER_SQL_HOST="${ROUTER_SQL_HOST:-172.30.0.20}"
ROUTER_SQL_PORT="${ROUTER_SQL_PORT:-5432}"
NODE1_SQL_HOST="${NODE1_SQL_HOST:-172.30.0.11}"
NODE2_SQL_HOST="${NODE2_SQL_HOST:-172.30.0.12}"
NODE_SQL_PORT="${NODE_SQL_PORT:-5432}"
COMPOSE=(docker compose -p "$PROJECT_NAME")

setup_logging() {
    local requested_log="$LOG_FILE"

    if ! mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || ! (: > "$LOG_FILE") 2>/dev/null; then
        LOG_FILE="/tmp/$(basename "$requested_log")"
        mkdir -p "$(dirname "$LOG_FILE")"
        : > "$LOG_FILE"
        printf 'Smoke-test log %s is not writable; using %s\n' "$requested_log" "$LOG_FILE"
    fi

    if [ "$LOG_TO_CONSOLE" = "1" ]; then
        exec > >(tee -a "$LOG_FILE") 2>&1
    else
        printf 'Smoke-test log: %s\n' "$LOG_FILE"
        exec >"$LOG_FILE" 2>&1
    fi

    echo "Log file: ${LOG_FILE}"
    echo "Started at: $(date -Is)"
}

check_docker_access() {
    if docker info >/dev/null 2>&1; then
        return 0
    fi

    cat >&2 <<'EOF'
Docker daemon is not accessible for the current user.

Check:
  docker ps

On Linux with /var/run/docker.sock owned by root:docker, add your user to the
docker group and start a new login session:
  sudo usermod -aG docker "$USER"
  newgrp docker

Or run this smoke test with sudo if that is how Docker is configured locally:
  sudo scripts/check-postgres-ha.sh

If you use Docker Desktop, make sure it is running and switch to its context:
  docker context use desktop-linux
EOF
    return 1
}

cleanup() {
    if [ "$KEEP_CLUSTER" != "1" ]; then
        "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
    fi
}

dump_diagnostics() {
    echo
    echo "Compose status:"
    timeout 10s "${COMPOSE[@]}" ps || true

    echo
    echo "SQL probe through PgBouncer (${PGBOUNCER_SQL_HOST}:${PGBOUNCER_SQL_PORT}):"
    sql "SELECT 1" 2>&1 || true

    echo
    echo "SQL probe through postgres-router (${ROUTER_SQL_HOST}:${ROUTER_SQL_PORT}):"
    router_sql "SELECT 1" 2>&1 || true

    echo
    echo "Postgres recovery states from one-shot client:"
    printf 'postgres-node1 (%s): ' "$NODE1_SQL_HOST"
    sql_on "$NODE1_SQL_HOST" "$NODE_SQL_PORT" "SELECT pg_is_in_recovery()" 2>&1 || true
    printf 'postgres-node2 (%s): ' "$NODE2_SQL_HOST"
    sql_on "$NODE2_SQL_HOST" "$NODE_SQL_PORT" "SELECT pg_is_in_recovery()" 2>&1 || true

    echo
    echo "Recent logs:"
    timeout -k 2s 20s "${COMPOSE[@]}" logs --tail=220 postgres-node1 postgres-node2 postgres-voter postgres-router pgbouncer || true
}

on_exit() {
    local rc=$?
    set +e

    if [ "$rc" -ne 0 ]; then
        dump_diagnostics
        if [ "$KEEP_ON_FAILURE" = "1" ]; then
            echo
            echo "Cluster was kept for debugging because KEEP_ON_FAILURE=1."
            echo "Clean it up with: docker compose -p ${PROJECT_NAME} down -v --remove-orphans"
            exit "$rc"
        fi
    fi

    cleanup
    exit "$rc"
}

sql_on() {
    local host="$1"
    local port="$2"
    local query="$3"

    timeout -k 2s "${SQL_EXEC_TIMEOUT}s" docker run --rm \
        --network "$NETWORK_NAME" \
        -e PGPASSWORD="$POSTGRES_PASSWORD" \
        -e PGCONNECT_TIMEOUT="$SQL_CONNECT_TIMEOUT" \
        --entrypoint psql \
        "$POSTGRES_CLIENT_IMAGE" \
        -h "$host" \
        -p "$port" \
        -U postgres \
        -d buysell \
        -v ON_ERROR_STOP=1 \
        -tAc "$query"
}

sql() {
    sql_on "$PGBOUNCER_SQL_HOST" "$PGBOUNCER_SQL_PORT" "$1"
}

router_sql() {
    sql_on "$ROUTER_SQL_HOST" "$ROUTER_SQL_PORT" "$1"
}

node_is_primary() {
    local service="$1"
    local host

    case "$service" in
        postgres-node1)
            host="$NODE1_SQL_HOST"
            ;;
        postgres-node2)
            host="$NODE2_SQL_HOST"
            ;;
        *)
            return 1
            ;;
    esac

    sql_on "$host" "$NODE_SQL_PORT" "SELECT NOT pg_is_in_recovery()" 2>/dev/null | tr -d '[:space:]' || true
}

current_primary() {
    local node
    for node in postgres-node1 postgres-node2; do
        if [ "$(node_is_primary "$node")" = "t" ]; then
            printf '%s\n' "$node"
            return 0
        fi
    done
    return 1
}

wait_for_pgbouncer_write() {
    local query="$1"
    local attempt=0
    local diagnostics_printed=0
    local elapsed
    local start

    start="$(date +%s)"

    while true; do
        if sql "$query" >/dev/null 2>&1; then
            echo
            return 0
        fi

        attempt=$((attempt + 1))
        elapsed=$(($(date +%s) - start))

        if [ "$diagnostics_printed" = "0" ] && [ "$elapsed" -ge "$DIAGNOSTICS_AFTER" ]; then
            echo
            echo "Still waiting after ${elapsed}s; current cluster snapshot:"
            dump_diagnostics
            diagnostics_printed=1
        else
            echo "Still waiting: attempt=${attempt}, elapsed=${elapsed}s"
        fi

        if [ "$elapsed" -ge "$WAIT_TIMEOUT" ]; then
            echo
            echo "Timed out after ${WAIT_TIMEOUT}s waiting for a writable PostgreSQL primary through PgBouncer." >&2
            return 1
        fi

        sleep 2
    done
}

setup_logging

echo "Starting HA stack in compose project ${PROJECT_NAME}..."
echo "Smoke script: RESET_CLUSTER=${RESET_CLUSTER} SQL_EXEC_TIMEOUT=${SQL_EXEC_TIMEOUT}s WAIT_TIMEOUT=${WAIT_TIMEOUT}s NETWORK_NAME=${NETWORK_NAME}"
check_docker_access
trap on_exit EXIT

if [ "$RESET_CLUSTER" = "1" ]; then
    echo "Resetting old smoke-test containers and volumes..."
    "${COMPOSE[@]}" down -v --remove-orphans
fi
"${COMPOSE[@]}" up -d --build

echo "Compose status after startup:"
"${COMPOSE[@]}" ps || true

echo "Waiting for writable primary through PgBouncer (${PGBOUNCER_SQL_HOST}:${PGBOUNCER_SQL_PORT})"
wait_for_pgbouncer_write "SELECT 1"

sql "CREATE TABLE IF NOT EXISTS ha_smoke (id bigserial PRIMARY KEY, note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())"
sql "INSERT INTO ha_smoke(note) VALUES ('before failover')"

PRIMARY="$(current_primary)"
echo "Current primary: ${PRIMARY}"

echo "Stopping ${PRIMARY} to force pacemaker failover..."
"${COMPOSE[@]}" stop "$PRIMARY"

wait_for_pgbouncer_write "INSERT INTO ha_smoke(note) VALUES ('after failover')"

NEW_PRIMARY="$(current_primary)"
COUNT="$(sql "SELECT count(*) FROM ha_smoke")"

echo "New primary: ${NEW_PRIMARY}"
echo "Rows written through PgBouncer: ${COUNT}"

if [ "$NEW_PRIMARY" = "$PRIMARY" ]; then
    echo "Failover did not move primary away from ${PRIMARY}" >&2
    exit 1
fi

if [ "${COUNT//[[:space:]]/}" -lt 2 ]; then
    echo "Smoke table row count is lower than expected" >&2
    exit 1
fi

echo "Pacemaker/Postgres failover smoke test passed."
if [ "$KEEP_CLUSTER" = "1" ]; then
    echo "Cluster was kept running because KEEP_CLUSTER=1."
fi

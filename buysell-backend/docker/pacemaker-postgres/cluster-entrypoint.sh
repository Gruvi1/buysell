#!/usr/bin/env bash
set -euo pipefail

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
POSTGRES_DB="${POSTGRES_DB:-taskdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_REPLICATION_USER="${POSTGRES_REPLICATION_USER:-replicator}"
POSTGRES_REPLICATION_PASSWORD="${POSTGRES_REPLICATION_PASSWORD:-replicator_password}"
NODE_NAME="${NODE_NAME:-$(hostname)}"
BOOTSTRAP_ROLE="${BOOTSTRAP_ROLE:-replica}"
PG_NODE_HAS_POSTGRES="${PG_NODE_HAS_POSTGRES:-true}"
CLUSTER_BOOTSTRAP="${CLUSTER_BOOTSTRAP:-false}"
PRIMARY_HOST="${PRIMARY_HOST:-pg-node1}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
REPLICA_READY_FILE="${REPLICA_READY_FILE:-/cluster-state/replica-ready}"
BOOTSTRAP_TIMEOUT="${BOOTSTRAP_TIMEOUT:-180}"

COROSYNC_PID=""
PACEMAKER_PID=""

log() {
    printf '[%s] %s\n' "$NODE_NAME" "$*"
}

run_as_postgres() {
    gosu postgres "$@"
}

prepare_runtime() {
    mkdir -p \
        /cluster-state \
        /run/corosync \
        /run/pacemaker \
        /var/lib/pacemaker/cib \
        /var/lib/postgresql/tmp \
        /var/log/pacemaker \
        /var/run/postgresql \
        "$PGDATA"

    chown -R postgres:postgres "$PGDATA" /var/lib/postgresql /var/run/postgresql
    chmod 700 "$PGDATA"

    rm -f /run/corosync/corosync.pid /run/pacemaker/pacemakerd.pid
}

write_pgpass() {
    cat > /var/lib/postgresql/.pgpass <<EOF
*:*:*:${POSTGRES_USER}:${POSTGRES_PASSWORD}
*:*:*:${POSTGRES_REPLICATION_USER}:${POSTGRES_REPLICATION_PASSWORD}
EOF
    chown postgres:postgres /var/lib/postgresql/.pgpass
    chmod 0600 /var/lib/postgresql/.pgpass
}

write_postgres_config() {
    local config_file="${PGDATA}/postgresql.conf"
    local hba_file="${PGDATA}/pg_hba.conf"

    if ! grep -q "buysell HA settings" "$config_file"; then
        cat >> "$config_file" <<'EOF'

# buysell HA settings
listen_addresses = '*'
port = 5432
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 256MB
hot_standby = on
password_encryption = 'scram-sha-256'
unix_socket_directories = '/var/run/postgresql'
EOF
    fi

    if ! grep -q "buysell HA access" "$hba_file"; then
        cat >> "$hba_file" <<EOF

# buysell HA access
host all all 0.0.0.0/0 scram-sha-256
host all all ::/0 scram-sha-256
host replication ${POSTGRES_REPLICATION_USER} 0.0.0.0/0 scram-sha-256
host replication ${POSTGRES_REPLICATION_USER} ::/0 scram-sha-256
EOF
    fi
}

create_database_and_roles() {
    run_as_postgres psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<EOSQL
SELECT 'CREATE DATABASE "${POSTGRES_DB}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\\gexec

DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${POSTGRES_REPLICATION_USER}') THEN
        CREATE ROLE "${POSTGRES_REPLICATION_USER}" WITH REPLICATION LOGIN PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
    ELSE
        ALTER ROLE "${POSTGRES_REPLICATION_USER}" WITH REPLICATION LOGIN PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
    END IF;
END
\$\$;
EOSQL
}

wait_for_replica_bootstrap() {
    local waited=0

    log "waiting for replica base backup marker ${REPLICA_READY_FILE}"
    until [ -f "$REPLICA_READY_FILE" ]; do
        if [ "$waited" -ge "$BOOTSTRAP_TIMEOUT" ]; then
            log "replica did not finish base backup within ${BOOTSTRAP_TIMEOUT}s; continuing cluster startup"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
    done
}

bootstrap_primary() {
    local initialized=false
    local pwfile

    if [ ! -s "${PGDATA}/PG_VERSION" ]; then
        log "initializing primary data directory"
        rm -f "$REPLICA_READY_FILE"
        pwfile="$(mktemp)"
        printf '%s\n' "$POSTGRES_PASSWORD" > "$pwfile"
        chown postgres:postgres "$pwfile"

        run_as_postgres initdb \
            --pgdata "$PGDATA" \
            --username "$POSTGRES_USER" \
            --pwfile "$pwfile" \
            --auth-local=trust \
            --auth-host=scram-sha-256

        rm -f "$pwfile"
        write_postgres_config
        initialized=true
    else
        write_postgres_config
    fi

    if [ "$initialized" = "true" ]; then
        log "starting temporary primary for initial replica base backup"
        run_as_postgres pg_ctl -D "$PGDATA" -w start
        create_database_and_roles
        wait_for_replica_bootstrap
        log "stopping temporary primary; pacemaker will take ownership"
        run_as_postgres pg_ctl -D "$PGDATA" -m fast -w stop
        touch "${PGDATA}/.buysell-primary-bootstrapped"
    fi
}

bootstrap_replica() {
    if [ -s "${PGDATA}/PG_VERSION" ]; then
        write_postgres_config
        touch "$REPLICA_READY_FILE"
        return 0
    fi

    log "waiting for bootstrap primary ${PRIMARY_HOST}:${PRIMARY_PORT}"
    until PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
        -h "$PRIMARY_HOST" \
        -p "$PRIMARY_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" >/dev/null 2>&1; do
        sleep 2
    done

    log "creating replica data directory with pg_basebackup"
    rm -rf "${PGDATA:?}/"*
    export PGPASSWORD="$POSTGRES_REPLICATION_PASSWORD"
    run_as_postgres pg_basebackup \
        -h "$PRIMARY_HOST" \
        -p "$PRIMARY_PORT" \
        -D "$PGDATA" \
        -U "$POSTGRES_REPLICATION_USER" \
        -Fp \
        -Xs \
        -c fast \
        -R \
        -P

    write_postgres_config
    touch "$REPLICA_READY_FILE"

    log "starting PostgreSQL standby"
    run_as_postgres pg_ctl -D "$PGDATA" -w start
}

bootstrap_postgres_data() {
    write_pgpass

    case "$BOOTSTRAP_ROLE" in
        primary)
            bootstrap_primary
            ;;
        replica)
            bootstrap_replica
            ;;
        *)
            log "unknown BOOTSTRAP_ROLE=${BOOTSTRAP_ROLE}"
            return 1
            ;;
    esac
}

stop_cluster() {
    log "stopping cluster processes"
    if [ -n "$PACEMAKER_PID" ] && kill -0 "$PACEMAKER_PID" >/dev/null 2>&1; then
        kill "$PACEMAKER_PID" >/dev/null 2>&1 || true
    fi
    if [ -n "$COROSYNC_PID" ] && kill -0 "$COROSYNC_PID" >/dev/null 2>&1; then
        kill "$COROSYNC_PID" >/dev/null 2>&1 || true
    fi
}

start_cluster() {
    log "starting corosync"
    corosync -f &
    COROSYNC_PID="$!"

    for _ in $(seq 1 60); do
        if corosync-cfgtool -s >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    log "starting pacemaker"
    pacemakerd -f &
    PACEMAKER_PID="$!"

    if [ "$CLUSTER_BOOTSTRAP" = "true" ]; then
        /usr/local/bin/configure-cluster.sh &
    fi

    wait -n "$COROSYNC_PID" "$PACEMAKER_PID"
}

main() {
    prepare_runtime

    if [ "$PG_NODE_HAS_POSTGRES" = "true" ]; then
        bootstrap_postgres_data
    fi

    trap stop_cluster INT TERM
    start_cluster
}

main "$@"

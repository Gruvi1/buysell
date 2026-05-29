#!/usr/bin/env bash
set -euo pipefail

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
POSTGRES_REPLICATION_USER="${POSTGRES_REPLICATION_USER:-replicator}"
POSTGRES_REPLICATION_PASSWORD="${POSTGRES_REPLICATION_PASSWORD:-replicator_password}"
PG_CLUSTER_NODE_LIST="${PG_CLUSTER_NODE_LIST:-pg-node1 pg-node2}"
PG_INITIAL_PRIMARY="${PG_INITIAL_PRIMARY:-pg-node1}"
PG_VOTER_NODE="${PG_VOTER_NODE:-pg-voter}"
PG_VIP="${PG_VIP:-172.30.0.100}"
PG_VIP_CIDR="${PG_VIP_CIDR:-24}"
PG_VIP_NIC="${PG_VIP_NIC:-eth0}"

log() {
    printf '[cluster-bootstrap] %s\n' "$*"
}

wait_for_pacemaker() {
    for _ in $(seq 1 120); do
        if crm_mon -1 >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done

    log "pacemaker did not become queryable"
    return 1
}

wait_for_quorum() {
    for _ in $(seq 1 120); do
        if corosync-quorumtool -s 2>/dev/null | grep -q "Quorate:.*Yes"; then
            return 0
        fi
        sleep 1
    done

    log "cluster did not reach quorum"
    return 1
}

wait_for_pacemaker_quorum() {
    for _ in $(seq 1 120); do
        if crm_mon -1 2>/dev/null | grep -q "partition with quorum"; then
            return 0
        fi
        sleep 1
    done

    log "pacemaker did not report a partition with quorum"
    return 1
}

wait_for_pacemaker
wait_for_quorum
wait_for_pacemaker_quorum

if crm configure show 2>/dev/null | grep -q '^primitive pg-primary '; then
    log "cluster resources already configured"
    exit 0
fi

log "loading pacemaker resources"
CONFIG_FILE="$(mktemp)"
trap 'rm -f "$CONFIG_FILE"' EXIT

cat > "$CONFIG_FILE" <<EOF
property cib-bootstrap-options: \
    stonith-enabled=false \
    no-quorum-policy=stop \
    cluster-recheck-interval=10s

rsc_defaults rsc-options: \
    resource-stickiness=100 \
    migration-threshold=3 \
    failure-timeout=60s

op_defaults op-options: \
    timeout=60s

primitive pg-primary ocf:buysell:pgsql-primary \
    params \
        pgctl="/usr/lib/postgresql/16/bin/pg_ctl" \
        psql="/usr/lib/postgresql/16/bin/psql" \
        pgdata="${PGDATA}" \
        pgdba="postgres" \
        pgport="5432" \
    op start timeout=90s \
    op stop timeout=90s \
    op monitor interval=10s timeout=30s

primitive pg-vip ocf:heartbeat:IPaddr2 \
    params \
        ip="${PG_VIP}" \
        cidr_netmask="${PG_VIP_CIDR}" \
        nic="${PG_VIP_NIC}" \
    op monitor interval=5s timeout=20s

group pg-service pg-primary pg-vip
location pg-service-not-on-voter pg-service -inf: ${PG_VOTER_NODE}
location prefer-initial-primary pg-service 100: ${PG_INITIAL_PRIMARY}
EOF

crm configure load update "$CONFIG_FILE"

log "cluster configuration loaded"

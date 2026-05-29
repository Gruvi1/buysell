FROM postgres:16-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        corosync \
        crmsh \
        haproxy \
        iproute2 \
        iputils-ping \
        netcat-openbsd \
        pacemaker \
        pgbouncer \
        procps \
        resource-agents \
    && rm -rf /var/lib/apt/lists/*

COPY corosync.conf /etc/corosync/corosync.conf
COPY cluster-entrypoint.sh /usr/local/bin/cluster-entrypoint.sh
COPY configure-cluster.sh /usr/local/bin/configure-cluster.sh
RUN mkdir -p /usr/lib/ocf/resource.d/buysell
COPY pgsql-primary.ocf /usr/lib/ocf/resource.d/buysell/pgsql-primary

RUN chmod 0644 /etc/corosync/corosync.conf \
    && chmod 0755 /usr/local/bin/cluster-entrypoint.sh /usr/local/bin/configure-cluster.sh \
    && chmod 0755 /usr/lib/ocf/resource.d/buysell/pgsql-primary

ENTRYPOINT ["/usr/local/bin/cluster-entrypoint.sh"]

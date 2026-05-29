# PostgreSQL HA: документация для Айдархана

Этот документ объясняет, как в проекте устроен отказоустойчивый PostgreSQL:
Pacemaker/Corosync управляют PostgreSQL primary и плавающим IP, HAProxy дает
стабильную точку входа к текущей primary, а PgBouncer пулит клиентские
соединения перед HAProxy.

## Короткая схема

```text
Spring app
  |
  | jdbc:postgresql://localhost:6432/buysell
  v
PgBouncer: localhost:6432 / 172.30.0.30:6432
  |
  | host=postgres-router port=5432
  v
HAProxy postgres-router: localhost:5432 / 172.30.0.20:5432
  |
  | backend 172.30.0.100:5432
  v
Pacemaker VIP: 172.30.0.100
  |
  v
Current PostgreSQL primary:
  postgres-node1 172.30.0.11
  or
  postgres-node2 172.30.0.12
```

Главная мысль: приложение не должно знать, какая PostgreSQL-нода сейчас primary.
Оно ходит в PgBouncer, PgBouncer ходит в HAProxy, HAProxy ходит на floating IP,
а floating IP находится на той ноде, которую Pacemaker считает active primary.

## Компоненты

### `postgres-node1`

PostgreSQL-capable нода. При чистом старте она предпочитается как начальная
primary:

- hostname внутри кластера: `pg-node1`;
- IP в compose-сети: `172.30.0.11`;
- volume с данными: `postgres-node1-data`;
- `BOOTSTRAP_ROLE=primary`;
- `CLUSTER_BOOTSTRAP=true`, поэтому именно она загружает Pacemaker-конфигурацию.

### `postgres-node2`

PostgreSQL-capable нода. При чистом старте создается как replica через
`pg_basebackup` от `pg-node1`:

- hostname внутри кластера: `pg-node2`;
- IP в compose-сети: `172.30.0.12`;
- volume с данными: `postgres-node2-data`;
- `BOOTSTRAP_ROLE=replica`;
- может быть promoted в primary при failover.

### `postgres-voter`

Quorum-only нода:

- hostname внутри кластера: `pg-voter`;
- IP в compose-сети: `172.30.0.13`;
- PostgreSQL на ней не запускается;
- нужна, чтобы в кластере было 3 голоса.

Без voter-ноды кластер из двух PostgreSQL-нод при сетевом разделении не сможет
надежно решить, кто имеет право продолжать работу. Третий голос помогает
избежать split-brain.

### `postgres-router`

HAProxy-контейнер:

- опубликован наружу как `localhost:5432`;
- внутри compose-сети имеет IP `172.30.0.20`;
- слушает TCP на `:5432`;
- проксирует трафик на `172.30.0.100:5432`.

HAProxy не выбирает PostgreSQL-ноду напрямую. Он смотрит только на VIP
`172.30.0.100`. Какая физическая нода держит этот VIP, решает Pacemaker.

### `pgbouncer`

PgBouncer-контейнер:

- опубликован наружу как `localhost:6432`;
- внутри compose-сети имеет IP `172.30.0.30`;
- слушает TCP на `:6432`;
- подключается к `postgres-router:5432`;
- использует `pool_mode = transaction`.

Именно через PgBouncer должно ходить Spring-приложение:

```text
jdbc:postgresql://localhost:6432/buysell
```

## Что делают Pacemaker и Corosync

### Corosync

Corosync отвечает за cluster membership и quorum:

- какие ноды живы;
- видят ли ноды друг друга;
- есть ли quorum;
- можно ли кластеру продолжать управлять ресурсами.

Проще говоря, Corosync отвечает на вопрос: "У нас есть достаточно участников,
чтобы принимать решения?"

### Pacemaker

Pacemaker управляет ресурсами:

- запускает PostgreSQL primary resource;
- останавливает resource при проблемах;
- переносит floating IP;
- решает, на какой ноде должен быть активный сервис.

В этом проекте Pacemaker управляет группой `pg-service`:

```text
pg-service
  pg-primary
  pg-vip
```

`pg-primary` - кастомный OCF resource agent из файла
`docker/pacemaker-postgres/pgsql-primary.ocf`.

`pg-vip` - стандартный OCF resource `ocf:heartbeat:IPaddr2`, который поднимает
floating IP `172.30.0.100`.

Группа важна: VIP должен находиться там же, где находится writable PostgreSQL
primary. Поэтому `pg-primary` и `pg-vip` идут вместе.

## Как стартует кластер

При `docker compose up -d --build` происходит следующее:

1. Собирается образ `buysell-pacemaker-postgres:local`.
2. `postgres-node1` инициализирует PostgreSQL data directory, если volume пустой.
3. `postgres-node1` временно запускает PostgreSQL, создает БД `buysell` и роль
   репликации.
4. `postgres-node2` ждет доступности `pg-node1:5432`.
5. `postgres-node2` делает `pg_basebackup` и становится standby.
6. Все cluster-ноды запускают Corosync и Pacemaker.
7. `postgres-node1` запускает `configure-cluster.sh`.
8. Pacemaker создает resources `pg-primary` и `pg-vip`.
9. HAProxy начинает проксировать `localhost:5432` на VIP `172.30.0.100`.
10. PgBouncer стартует после healthcheck-а `postgres-router` и открывает
    `localhost:6432`.

## Как работает failover

Допустим, текущая primary - `postgres-node1`.

Если `postgres-node1` остановилась:

1. Corosync видит, что участник кластера пропал.
2. Pacemaker пересчитывает состояние ресурсов.
3. Так как есть quorum через `postgres-node2` + `postgres-voter`, кластер может
   принять решение.
4. Pacemaker запускает `pg-primary` на `postgres-node2`.
5. Resource agent проверяет, что PostgreSQL на `postgres-node2` был standby, и
   выполняет promote.
6. VIP `172.30.0.100` переезжает на `postgres-node2`.
7. HAProxy продолжает смотреть на тот же VIP.
8. PgBouncer переподключает backend-соединения через HAProxy.
9. Новые запросы приложения снова попадают в writable primary.

Для приложения endpoint не меняется:

```text
localhost:6432
```

## Зачем нужен HAProxy

HAProxy здесь дает стабильный TCP endpoint перед Pacemaker VIP.

Технически PgBouncer мог бы ходить прямо на `172.30.0.100:5432`, но отдельный
`postgres-router` полезен:

- наружу остается привычный PostgreSQL endpoint `localhost:5432`;
- HAProxy healthcheck быстрее показывает, доступен ли VIP;
- можно менять backend-логику отдельно от PgBouncer;
- проще диагностировать: отдельно проверяем HAProxy и отдельно PgBouncer.

Конфиг лежит здесь:

```text
docker/haproxy/haproxy.cfg
```

Главная строка backend-а:

```text
server pg-vip 172.30.0.100:5432 check inter 2s fall 2 rise 2
```

Это значит: HAProxy подключается к floating IP, а не к конкретной ноде.

## Зачем нужен PgBouncer

PgBouncer уменьшает количество реальных PostgreSQL-соединений.

Без PgBouncer каждое соединение из приложения или HikariCP превращается в
отдельный backend process в PostgreSQL. На маленьком кластере это быстро
становится дорогим.

PgBouncer принимает много клиентских соединений и переиспользует меньшее число
соединений к PostgreSQL.

Конфиг лежит здесь:

```text
docker/pgbouncer/pgbouncer.ini
```

Важные настройки:

```ini
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 2
reserve_pool_size = 5
```

`pool_mode = transaction` означает: клиент получает backend-соединение только на
время транзакции. После commit/rollback соединение возвращается в пул и может
быть отдано другому клиенту.

Это хороший режим для web-приложений, но у него есть ограничения:

- нельзя рассчитывать на session state между транзакциями;
- нельзя использовать session-level advisory locks как долгоживущий state;
- server-side prepared statements могут конфликтовать с переиспользованием
  backend-сессий.

Поэтому в Spring datasource задано:

```properties
spring.datasource.hikari.data-source-properties.prepareThreshold=0
```

Это отключает server-side prepared statements в PostgreSQL JDBC driver.

## Где лежат основные файлы

```text
docker-compose.yml
  Сервисы postgres-node1, postgres-node2, postgres-voter, postgres-router,
  pgbouncer, сеть pg-ha, volumes.

docker/pacemaker-postgres/Dockerfile
  Общий образ для PostgreSQL/Pacemaker/Corosync/HAProxy/PgBouncer.

docker/pacemaker-postgres/cluster-entrypoint.sh
  Bootstrap PostgreSQL data directory, запуск Corosync и Pacemaker.

docker/pacemaker-postgres/configure-cluster.sh
  Создание Pacemaker resources.

docker/pacemaker-postgres/pgsql-primary.ocf
  Resource agent, который стартует/promote-ит writable PostgreSQL primary.

docker/haproxy/haproxy.cfg
  TCP proxy на floating IP.

docker/pgbouncer/pgbouncer.ini
  PgBouncer database mapping и pool-настройки.

docker/pgbouncer/userlist.txt
  Пользователи PgBouncer для client authentication.

scripts/check-postgres-ha.sh
  Smoke-тест failover-а через PgBouncer.
```

## Как запустить

```bash
docker compose up -d --build
```

Проверить контейнеры:

```bash
docker compose ps
```

Проверить подключение через PgBouncer:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d buysell -c "SELECT 1;"
```

Проверить подключение напрямую через HAProxy:

```bash
PGPASSWORD=kira psql -h localhost -p 5432 -U postgres -d buysell -c "SELECT 1;"
```

Для приложения правильный endpoint:

```text
jdbc:postgresql://localhost:6432/buysell
```

## Как посмотреть состояние кластера

Разовая сводка Pacemaker:

```bash
docker compose exec postgres-node1 crm_mon -1
```

Живая сводка Pacemaker:

```bash
docker compose exec postgres-node1 crm_mon
```

Посмотреть cluster configuration:

```bash
docker compose exec postgres-node1 crm configure show
```

Проверить quorum:

```bash
docker compose exec postgres-node1 corosync-quorumtool -s
```

Понять, какая PostgreSQL-нода primary:

```bash
PGPASSWORD=kira psql -h localhost -p 5432 -U postgres -d buysell \
  -c "SELECT pg_is_in_recovery();"
```

Если результат `f`, endpoint ведет на primary. Если `t`, это standby.
Через HAProxy/PgBouncer в норме должен быть результат `f`.

## Как посмотреть PgBouncer

Проверить, что PgBouncer отвечает:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d buysell -c "SELECT 1;"
```

Посмотреть PgBouncer pools:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d pgbouncer \
  -c "SHOW POOLS;"
```

Посмотреть clients:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d pgbouncer \
  -c "SHOW CLIENTS;"
```

Посмотреть servers:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d pgbouncer \
  -c "SHOW SERVERS;"
```

Логи:

```bash
docker compose logs -f pgbouncer
```

## Как посмотреть HAProxy

Проверка через опубликованный порт:

```bash
PGPASSWORD=kira psql -h localhost -p 5432 -U postgres -d buysell -c "SELECT 1;"
```

Логи:

```bash
docker compose logs -f postgres-router
```

Если HAProxy не видит VIP, PgBouncer тоже не сможет подключиться к PostgreSQL.

## Как проверить failover вручную

Сначала найди текущую primary:

```bash
docker compose exec postgres-node1 crm_mon -1
```

Или проверь каждую ноду:

```bash
docker compose exec postgres-node1 gosu postgres psql -d buysell \
  -tAc "SELECT NOT pg_is_in_recovery();"

docker compose exec postgres-node2 gosu postgres psql -d buysell \
  -tAc "SELECT NOT pg_is_in_recovery();"
```

Останови текущую primary. Например, если primary - `postgres-node1`:

```bash
docker compose stop postgres-node1
```

Подожди, пока Pacemaker промоутит вторую ноду:

```bash
docker compose exec postgres-node2 crm_mon -1
```

Проверь запись через PgBouncer:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d buysell \
  -c "CREATE TABLE IF NOT EXISTS ha_manual_check(id bigserial primary key, created_at timestamptz default now());"

PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d buysell \
  -c "INSERT INTO ha_manual_check DEFAULT VALUES;"
```

Вернуть остановленную ноду:

```bash
docker compose start postgres-node1
```

Важно: старая primary после возврата не обязательно автоматически станет primary
снова. Это нормально. Pacemaker держит сервис там, где он сейчас стабильно
работает, с учетом stickiness и текущего состояния.

## Автоматический smoke-тест

В проекте есть скрипт:

```bash
scripts/check-postgres-ha.sh
```

Он делает следующее:

1. Поднимает отдельный compose project `buysell-ha-smoke`.
2. Ждет writable primary через PgBouncer.
3. Создает smoke-таблицу.
4. Пишет строку до failover.
5. Останавливает текущую primary.
6. Ждет, пока запись через PgBouncer снова станет возможной.
7. Пишет строку после failover.
8. Проверяет, что primary сменилась и данные доступны.

Запуск:

```bash
scripts/check-postgres-ha.sh
```

Оставить кластер после теста для ручной диагностики:

```bash
KEEP_CLUSTER=1 scripts/check-postgres-ha.sh
```

Писать лог в консоль:

```bash
LOG_TO_CONSOLE=1 scripts/check-postgres-ha.sh
```

Если локальный `logs/postgres-ha-smoke.log` недоступен на запись, скрипт
автоматически использует `/tmp/postgres-ha-smoke.log`.

## Диагностика типовых проблем

### Приложение не подключается к БД

Проверь путь сверху вниз:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d buysell -c "SELECT 1;"
PGPASSWORD=kira psql -h localhost -p 5432 -U postgres -d buysell -c "SELECT 1;"
docker compose exec postgres-node1 crm_mon -1
docker compose logs --tail=100 pgbouncer postgres-router
```

Если `6432` не работает, а `5432` работает - проблема в PgBouncer.

Если `5432` не работает - смотри HAProxy, VIP и Pacemaker.

### HAProxy не подключается к backend

Проверь, где VIP:

```bash
docker compose exec postgres-node1 ip addr show eth0
docker compose exec postgres-node2 ip addr show eth0
```

VIP `172.30.0.100` должен быть только на одной PostgreSQL-ноде.

Проверь resources:

```bash
docker compose exec postgres-node1 crm_mon -1
docker compose exec postgres-node1 crm_resource --list
```

### PgBouncer отвечает, но запросы зависают

Посмотри pools и servers:

```bash
PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d pgbouncer \
  -c "SHOW POOLS;"

PGPASSWORD=kira psql -h localhost -p 6432 -U postgres -d pgbouncer \
  -c "SHOW SERVERS;"
```

Проверь, не закончились ли backend-соединения:

- `cl_active` - активные клиенты;
- `cl_waiting` - клиенты ждут свободный backend;
- `sv_active` - активные server-соединения;
- `sv_idle` - свободные server-соединения.

Если `cl_waiting` постоянно растет, возможно, нужно поднять
`default_pool_size`, оптимизировать долгие транзакции или уменьшить количество
параллельных запросов от приложения.

### После failover некоторое время есть ошибки подключения

Это нормально для текущей схемы. Во время failover есть короткое окно:

- старая primary уже недоступна;
- новая primary еще не promoted;
- VIP еще не переехал;
- HAProxy и PgBouncer еще переподключаются.

Клиентское приложение должно уметь повторять транзакцию, если соединение
оборвалось во время failover.

## Безопасная очистка

Остановить контейнеры без удаления данных:

```bash
docker compose down
```

Полностью удалить контейнеры и volumes с PostgreSQL data:

```bash
docker compose down -v --remove-orphans
```

Команда с `-v` удаляет данные БД. Использовать только когда точно нужен чистый
старт.

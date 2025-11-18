# Docker Compose для PostgreSQL, Redis и pgAdmin4

Этот compose-файл позволяет поднять СУБД PostgreSQL 16, Redis 7 и pgAdmin4 одной командой как на VPS с Ubuntu, так и на локальном компьютере разработчика. Конфигурация находится в `docker-compose.yml` и содержит три сервиса:

- `postgres` — основная база для Palompy.
- `redis` — in-memory хранилище для rate limiting и кешей.
- `pgadmin` — web-интерфейс для администрирования PostgreSQL, доступный по HTTP.

## Быстрый старт

1. Перейдите в директорию `infrastructure/docker` и (опционально) создайте файл `.env` со своими значениями:
   ```bash
   POSTGRES_DB=palompy
   POSTGRES_USER=palompy
   POSTGRES_PASSWORD=supersecret
   POSTGRES_PORT=5432
   REDIS_PORT=6379
   PGADMIN_PORT=5050
   PGADMIN_DEFAULT_EMAIL=admin@example.com
   PGADMIN_DEFAULT_PASSWORD=pgAdminPassw0rd
   ```
2. Запустите стек:
   ```bash
   docker compose up -d
   ```
   На VPS команда та же самая, только выполняйте её от пользователя с правами на Docker.
3. Проверьте, что сервисы поднялись:
   ```bash
   docker compose ps
   docker compose logs -f postgres
   docker compose logs -f redis
   docker compose logs -f pgadmin
   ```
4. Подключайтесь к сервисам:
   - **PostgreSQL**: `postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@<host>:<POSTGRES_PORT>/<POSTGRES_DB>`.
   - **Redis**: `redis://<host>:<REDIS_PORT>`.
   - **pgAdmin4**: `http://<host>:<PGADMIN_PORT>` в браузере.

## Настройка pgAdmin4

После первого входа в pgAdmin4 (логин/пароль берутся из `.env`) добавьте подключение к контейнеру PostgreSQL:

1. Нажмите **Add New Server**.
2. На вкладке *General* задайте имя (например, `Palompy Postgres`).
3. На вкладке *Connection* укажите:
   - **Host name/address**: `postgres` (если pgAdmin запущен в том же compose) или внешний IP/домен VPS.
   - **Port**: `5432` или значение `POSTGRES_PORT`.
   - **Maintenance database**: `palompy`.
   - **Username/Password**: как в `.env`.
4. Сохраните и убедитесь, что соединение работает.

## Остановка и обслуживание

```bash
docker compose down         # остановить сервисы
docker compose down -v      # удалить и данные, и контейнеры
```

Для обновления образов выполните `docker compose pull` и затем снова `docker compose up -d`.

# Palompy — руководство по запуску

Этот репозиторий содержит демонстрационную платформу Palompy. Она включает несколько компонентов: TypeScript/Node.js backend, Next.js веб-интерфейс для операторов, виджет для встраивания на сайты магазинов и инфраструктурные файлы. Ниже собраны минимальные требования, порядок настройки и объяснения всех переменных окружения, которые нужно указать, чтобы система заработала целиком.

## Что входит в проект

- `backend/` — API на Node.js, которое обрабатывает запросы виджета, ходит в PostgreSQL, OpenAI и сторонние API. Сборка определяется в `backend/package.json`.
- `web/` — админка на Next.js/NextAuth. Она подключается к той же базе данных и Stripe (см. `web/package.json`).
- `frontend-widget/` — статичный скрипт, который вставляется в витрину магазина и обращается к backend через HTTPS.
- `database/` — SQL-скрипт `schema.sql` с основными таблицами пользователей, ролей и подписок.
- `infrastructure/` — черновики конфигураций Nginx/Terraform для продовой среды.
- `docs/` и файлы верхнего уровня содержат проектную документацию на русском языке.

## Предварительные требования

1. **Node.js 18+ и npm** — нужны как для backend, так и для Next.js-приложения.
2. **PostgreSQL 15+** с расширением `pgvector` (включите `CREATE EXTENSION IF NOT EXISTS vector;` перед применением схемы).
3. **Redis** (локально или в облаке) — используется middleware rate limiter'ом (`backend/services/redisClient.ts`).
4. **OpenAI API key** и доступ к модели `gpt-4o-mini` или совместимой.
5. **Stripe** (ключ и ID тарифа) — чтобы страница подписки в Next.js могла создавать checkout-сессии.
6. **Готовый домен + Nginx** — для TLS-терминации и проксирования `/api` (см. `infrastructure/nginx/palompy.conf`).

> Если не хочется поднимать PostgreSQL и Redis вручную, используйте `docker compose`-стек из `infrastructure/docker`. Он поднимает PostgreSQL 16, Redis 7 и pgAdmin4 одной командой и одинаково хорошо работает на VPS с Ubuntu и на локальной машине. Подробности в `infrastructure/docker/README.md`.

## Подготовка базы данных

1. Создайте отдельную БД `palompy` и пользователя с правами на неё.
2. Выполните скрипт `database/schema.sql` в выбранной БД:
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/palompy -f database/schema.sql
   ```
3. При необходимости создайте дополнительные таблицы для логов и доменных данных (товары, knowledge chunks и т.п.) — этот репозиторий содержит только каркас.

## Установка зависимостей

```bash
cd backend
npm install
npm run build
cd ../web
npm install
```

`frontend-widget/` — обычный npm-проект без сборки; при необходимости запустите `npm install` и соберите bundle любым выбранным инструментом.

## Переменные окружения

Backend считывает `.env` при старте (`backend/config/env.ts`) и может дополнительно грузить секреты из файла или JSON-хранилища. Frontend использует Next.js-конвенции и пример лежит в `web/.env.example`. Ниже перечислены все ключи и зачем они нужны.

### Backend (`backend/.env`)

| Переменная | Назначение |
| --- | --- |
| `PORT` | TCP-порт, на котором запускается Express-сервер (по умолчанию 4000). |
| `DATA_FILE` | Путь к локальному JSON-хранилищу, если временно не используется PostgreSQL. |
| `DATABASE_URL` | Строка подключения к PostgreSQL (используется библиотекой `pg`). |
| `OPENAI_API_KEY` | Ключ OpenAI для генерации ответов ассистента. |
| `OPENAI_MODEL` | Имя модели, которую вызывает backend. По умолчанию `gpt-4o-mini`. |
| `OPENAI_BASE_URL` | Базовый URL API OpenAI (можно указывать совместимые шлюзы). |
| `API_JWT_SECRET` | Секрет для подписания внутренних JWT, которыми защищены `/api/proxy` и сервисные ручки. |
| `THIRD_PARTY_API_BASE_URL` | Базовый URL стороннего сервиса, для которого работает `/api/proxy`. |
| `THIRD_PARTY_API_KEY` | Ключ стороннего сервиса, когда его можно хранить прямо в переменной окружения. |
| `THIRD_PARTY_API_KEY_FILE` | Путь к файлу с ключом, если не хотите класть его в plaintext. |
| `THIRD_PARTY_API_KEY_SECRET_NAME` | Имя секрета в JSON-файле `SECRETS_MANAGER_FILE`. |
| `SECRETS_MANAGER_FILE` | Путь к JSON с секретами. Backend сначала читает его и только потом переменные. |
| `REDIS_URL` | URL экземпляра Redis для rate limiter'а (падает на in-memory fallback, если переменная пустая). |
| `RATE_LIMIT_WINDOW_MS` | Размер окна для лимита запросов в миллисекундах. |
| `RATE_LIMIT_MAX_REQUESTS` | Количество запросов в окне для одного клиента. |
| `CSRF_TOKEN_TTL_MS` | Срок жизни выданных CSRF-токенов. |
| `TWO_FACTOR_ENCRYPTION_KEY` | Ключ AES-256-GCM для шифрования TOTP-секретов в `user_security_settings`. |
| `TWO_FACTOR_ENCRYPTION_KEY_FILE` | Путь к файлу с ключом, если он не хранится в env. |
| `TWO_FACTOR_ENCRYPTION_KEY_SECRET_NAME` | Имя секрета для key rotation при использовании JSON-хранилища. |

### Frontend (`web/.env.local`)

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | Тот же PostgreSQL, что и у backend (Next.js использует его для запросов и аутентификации). |
| `NEXTAUTH_SECRET` | Секрет NextAuth для подписи session tokens. Обязательно поменяйте в продакшене. |
| `NEXTAUTH_URL` | Базовый URL, по которому доступна админка (нужен NextAuth для callback'ов). |
| `LOGIN_ACCESS_CODE` | Простой одноразовый код доступа, который проверяется на этапе логина. |
| `STRIPE_SECRET_KEY` | Секретный ключ Stripe (sk_live или sk_test). |
| `STRIPE_PRICE_ID` | ID тарифа/подписки, на которую оформляется Checkout. |
| `STRIPE_SUCCESS_URL` | URL страницы успеха после оплаты (Next.js будет подставлять `session_id`). |
| `STRIPE_CANCEL_URL` | URL страницы, на которую вернуть пользователя при отмене оплаты. |
| `API_JWT_SECRET` | Должен совпадать с backend, чтобы админка могла вызывать защищённые API-эндпойнты. |

## Запуск в режиме разработки

1. **Запустите PostgreSQL и Redis.** Убедитесь, что `DATABASE_URL` и `REDIS_URL` смотрят на локальные инстансы.
2. **Заполните `.env` файлы.**
   - `backend/.env` — значения из таблицы выше + ключи OpenAI/Redis.
   - `web/.env.local` — можно скопировать из `web/.env.example` и поменять чувствительные поля.
3. **Backend:**
   ```bash
   cd backend
   npm run build   # одноразовая компиляция
   npm start       # запускает dist/src/index.js
   ```
   Для hot reload можно держать отдельный терминал с `npm run dev`, чтобы TypeScript пересобирался по мере изменений.
4. **Frontend:**
   ```bash
   cd web
   npm run dev
   ```
   Next.js поднимет админку на `http://localhost:3000` (см. `NEXTAUTH_URL`).
5. **Виджет:**
   - Соберите `frontend-widget/widget.js` и разместите его на любом CDN/сервере.
   - Подключите тег `<script src="https://your-domain.com/widget.js" data-shop-id="PUBLIC_KEY"></script>` на сайте магазина.
   - Убедитесь, что скрипт стучится на backend по HTTPS и передаёт `shopPublicKey`, `sessionId` и сообщение пользователя.

После этого можно регистрировать магазины через API, загружать знания и проверять ответы ассистента прямо в тестовом магазине.

## Запуск в продакшене

1. Соберите backend: `npm run build` и разверните `node dist/src/index.js` за Nginx-реверсом (см. `infrastructure/nginx/palompy.conf`).
2. Для Next.js выполните `npm run build && npm run start` (в `web/`).
3. Настройте `pm2`/systemd или Docker Compose, чтобы оба сервиса перезапускались автоматически.
4. Укажите переменные окружения через секреты облака или файлы, не коммитьте `.env` в Git.
5. Проверьте выдачу TLS-сертификатов (Let's Encrypt) и работоспособность CSRF/Rate-limit middleware.

Следуя этим шагам, проект поднимается как локально, так и в продакшене, при условии что все обязательные переменные окружения заполнены и есть доступ к OpenAI, Redis и Stripe.

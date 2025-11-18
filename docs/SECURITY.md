# Palompy Security Hardening

## TLS termination & reverse proxy
* `infrastructure/nginx/palompy.conf` configures Nginx to terminate TLS (Let's Encrypt certificates), forces HTTPS, enables HTTP/2, and injects HSTS/defensive headers before forwarding requests to the Node.js backend listening on `127.0.0.1:4000`.
* `/api/proxy` is only reachable through the reverse proxy, which keeps the third-party API key server-side while propagating client IP information via `X-Forwarded-*` headers.

## Secret management & API proxying
* `backend/config/env.ts` now resolves sensitive values from environment variables, secure files, or a JSON-based secrets manager (`SECRETS_MANAGER_FILE`). `THIRD_PARTY_API_KEY` is therefore never exposed to the browser and is injected inside `ProxyController` before forwarding requests.
* The `/api/proxy` handler validates JWTs, enforces active subscriptions, and performs strict RBAC (`integration:invoke` or `admin` roles via the `user_roles` table).

## Web security middleware
* Global CSRF protection issues per-session tokens via `GET /api/security/csrf`; all non-GET requests must provide `X-Session-Id` + `X-CSRF-Token` headers.
* `backend/security/rateLimiter.ts` provides Redis-based request throttling with an automatic in-memory fallback to keep the API responsive during outages.
* `docs/` users should ensure their embedding clients fetch the CSRF token before making POST/PUT/PATCH/DELETE requests.

## Two-factor authentication (2FA)
* `backend/services/twoFactorService.ts` manages encrypted TOTP secrets (`AES-256-GCM`), recovery codes, and verification helpers stored in the `user_security_settings` table.
* `POST /api/security/2fa/setup` + `/enable` routes allow privileged operators (roles `owner`/`admin`) to bootstrap and activate TOTP-based 2FA flows.

## Data-at-rest protections
* PostgreSQL tables now include `user_roles` and `user_security_settings`. Deploy Postgres on encrypted volumes (e.g., LUKS or managed cloud storage with disk encryption enabled) so these secrets remain encrypted at rest.
* Stripe is already used for subscription payments (`web/lib/stripe.ts`), which keeps PCI-sensitive data outside of Palompy infrastructure.
* When running Postgres manually, enable `ssl=on`, configure full-disk encryption for the VM/disk, and restrict physical backups to encrypted destinations (e.g., S3 with SSE-KMS).

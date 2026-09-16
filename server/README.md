# Sundry Foods Signage & Queue API

Self-hosted NestJS backend for the Sundry Foods digital signage and queue
management console. PostgreSQL + Prisma, JWT auth, SMTP email alerts, in-app
notifications and web push. Designed to be dropped into its own repository and
hosted on your own infrastructure (Azure App Service, a VM, or Docker).

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | NestJS 11 (Express)                      |
| Database       | PostgreSQL via Prisma 6                  |
| Auth           | JWT access + rotating refresh tokens     |
| Email          | SMTP (nodemailer)                        |
| Notifications  | In-app records + Web Push (VAPID)        |
| Scheduled jobs | @nestjs/schedule (screen + queue alerts) |
| API docs       | Swagger at `/api/docs`                   |

## Quick start

```bash
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, SMTP, VAPID
npm install
npx prisma migrate dev --name init
npm run seed              # brands, outlets, roles, prep timings, super admin
npm run start:dev
```

The API listens on `http://localhost:3000/api`, docs at `/api/docs`.

Seeded super admin: `admin@sundryfoods.com` / `ChangeMe!2026`
(override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Change the password
immediately after the first sign-in.

Web push keys: `npm run keys:vapid`, then paste the pair into `.env`.

## Docker

```bash
docker compose up --build
```

Brings up PostgreSQL and the API; migrations run automatically on container
start (`prisma migrate deploy`).

## Roles, brands and modules

Roles are rows in the `Role` table, never a flag on the user. Each role carries:

- `tier` — `ORGANIZATION`, `BRAND` or `OUTLET`
- `allBrands` — organisation-wide reach (the Super Admin / Overview workspace)
- `modules` — which console modules the role may open
- `canPublish`, `canApprove`, `canManageUsers` — capability flags

A user is attached to one role plus a list of brands (`BrandMembership`), so a
brand admin can cover one brand or several. Every read and write is filtered by
that brand scope; touching a brand outside it returns 403.

## Approval flow

Nothing goes live without a line manager. Creatives, playlists, campaigns and
announcements start as `DRAFT`, are submitted (`POST /:id/submit`) which creates
a `PENDING` approval request and emails/notifies every approver for the brand,
and only an `APPROVED` item can be published. Sending an item back notifies the
submitter with the reviewer's note.

## POS integration

Tills post paid orders to:

```
POST /api/public/pos/orders
x-sundry-signature: sha256=<hex HMAC-SHA256 of the raw body, key POS_WEBHOOK_SECRET>

{
  "order_id": "POS-10231",
  "ticket": "A-214",
  "brand_id": "kilimanjaro",
  "outlet_id": "<outlet id>",
  "channel": "Counter",
  "customer": "Ada O.",
  "paid_at": "2026-02-14T10:31:00Z",
  "items": [{ "name": "Jollof Bowl", "quantity": 2 }]
}
```

The POS only reports that the order was placed and paid. Preparing / Ready /
Collected are derived from the prep minutes configured per brand and product
line (`/api/queue/prep-config`), so counter boards advance on their own.

Signing example:

```bash
BODY='{"order_id":"POS-1","brand_id":"kilimanjaro","items":[{"name":"Jollof Bowl"}]}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$POS_WEBHOOK_SECRET" -hex | awk '{print $2}')
curl -X POST http://localhost:3000/api/public/pos/orders \
  -H "content-type: application/json" -H "x-sundry-signature: sha256=$SIG" -d "$BODY"
```

## Player endpoints (no console session)

- `POST /api/screens/pair` — device posts its pairing PIN, receives its identity
- `POST /api/screens/heartbeat` — keeps the screen online; missing heartbeats
  flip it offline and raise an alert
- `GET /api/screens/:code/playback` — the approved, published campaign slides
  and announcement ticker the player should show right now
- `GET /api/public/queue/board/:code` — counter board tickets for a QMS screen
- `GET /api/public/player/update?versionCode=N` — the newest published player
  build, so a box can update itself (see `../player/README.md`)

## Alerts

Two cron watchers produce the console's alerts, each writing an audit event and
notifying the brand's operators by in-app notification, web push and email:

- screens silent for longer than `SCREEN_OFFLINE_AFTER_MINUTES`
- queue tickets more than `QUEUE_OVERDUE_ALERT_MINUTES` past their ready time

## Endpoint map

| Area          | Routes                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| Auth          | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`      |
| Brands        | `GET/POST /brands`, `GET /brands/outlets`, `POST /brands/:id/outlets`    |
| Screens       | `GET /screens`, `/screens/health`, pairing, resync, player endpoints     |
| Media         | `GET/POST/PUT/DELETE /media`, `POST /media/:id/submit`                   |
| Playlists     | `GET/POST/PUT/DELETE /playlists`, `POST /playlists/:id/submit`           |
| Schedules     | `GET/POST/PUT /schedules`, `/:id/submit`, `/:id/publish`                 |
| Announcements | `GET/POST /announcements`, `/:id/submit`, `/:id/publish`                 |
| Approvals     | `GET /approvals`, `/approvals/pending-count`, `/submit`, `/:id/review`   |
| Queue         | `GET /queue/board`, `/queue/prep-config`, prep updates, collect          |
| Users & roles | `GET /users`, `/users/roles`, invite, update access, resend invite       |
| Audit         | `GET /audit`                                                            |
| Notifications | `GET /notifications`, read state, web-push subscribe                    |
| Player OTA    | `GET /public/player/update`, `GET/POST /player/releases`                 |
| Health        | `GET /health`                                                           |

## Tests and checks

```bash
npm run typecheck
npm run lint
npm test
```

## Publishing to its own repository

This folder is self-contained. To split it out:

```bash
cp -r server /path/to/sundry-signage-api
cd /path/to/sundry-signage-api
git init && git add . && git commit -m "Initial commit: Sundry signage API"
```

`.env` is git-ignored; ship `.env.example` only.

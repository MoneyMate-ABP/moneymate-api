# MoneyMate API

Backend for MoneyMate Expense Tracker using Express.js, JWT, and SQL (PostgreSQL/MySQL).

## Features

- JWT auth: register, login, logout (token revocation)
- Google login via Firebase ID token
- Default categories (per-user, auto-created on registration): Gaji, Makanan, Transportasi, Hiburan, Lainnya
- Transactions: create, edit, delete, filter by date/type/category
- Budget periods: multiple active periods supported
- Budget period supports custom excluded days and one default period per user
- Transaction can auto-use default budget period when `budget_period_id` is not sent
- Realtime carry-over daily budget calculation
- Dashboard summary with budget status for today
- Daily 08:00 web push budget reminder (cron)
- Push subscription endpoints (subscribe, unsubscribe, public VAPID key)
- Notification history (last 5, unread count, mark read, mark all read)
- Optional geolocation for transactions
- Optional pagination (`page`, `limit`) on list endpoints for lazy loading / infinite scroll

## Security

- **Rate Limiting**:
  - Global: Burst limit of `60 req / 1 min` and sustain limit of `500 req / 15 min`.
  - Auth: Strict limit of `7 req / 15 min` on login and register endpoints to prevent brute-force attacks.
- **Duplicate Prevention**: 60-second duplicate blocking on `POST /api/transactions` and `POST /api/budget-periods` to avoid accidental double-clicks.
- **Payload Limits**: Max JSON payload size is restricted to `10kb`.
- **HPP**: Protection against HTTP Parameter Pollution included.
## Tech

- Express.js
- Knex.js
- PostgreSQL / MySQL
- JWT (`jsonwebtoken`)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env config:

```bash
cp .env.example .env
```

3. Adjust DB credentials in `.env`.

4. (Opsional, untuk Google login) isi kredensial Firebase Admin di `.env`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (gunakan escaped new line: `\\n`)

5. (Wajib untuk Web Push) isi konfigurasi VAPID di `.env`:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_MAILTO` (format: `mailto:you@example.com`)

6. Database creation:

- If the DB does not exist yet, server startup will attempt to auto-create it (PostgreSQL/MySQL).
- The DB user in `.env` must have permission to create database.

7. Jalankan migration:

```bash
npm run migrate
```

8. Jalankan seed default data:

```bash
npm run seed
```

9. Run API in dev mode:

```bash
npm run dev
```

Server starts on `http://localhost:3000`.

## Run with Docker

1. Buat Docker env file dari template:

```bash
cp .env.docker.example .env.docker
```

2. Ubah secret di `.env.docker` (wajib):

- `JWT_SECRET`
- `MYSQL_ROOT_PASSWORD`
- `DB_PASSWORD` dan `MYSQL_PASSWORD`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (wajib jika menggunakan `POST /api/auth/google`)

3. Build dan jalankan service API + MySQL:

```bash
docker compose up --build
```

4. Akses API di:

- `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`

5. Akses MySQL host machine (opsional):

- Host: `127.0.0.1`
- Port: `3307`
- User: sesuai `DB_USER` di `.env.docker`
- Password: sesuai `DB_PASSWORD` di `.env.docker`
- DB: sesuai `DB_NAME` di `.env.docker`

Perintah tambahan:

- Stop containers:

```bash
docker compose down
```

- Stop + hapus data MySQL volume:

```bash
docker compose down -v
```

Keamanan:

- `docker-compose.yml` tidak menyimpan secret lagi.
- Gunakan `.env.docker` untuk local/dev dan jangan commit file tersebut.
- Untuk production, gunakan secret manager atau Docker secrets.

### Docker CLI Cheat Sheet

Masuk shell container API:

```bash
docker compose exec api sh
```

Jalankan migration di container API:

```bash
docker compose exec api npm run migrate
```

Jalankan seed di container API:

```bash
docker compose exec api npm run seed
```

Jalankan migrate fresh di container API:

```bash
docker compose exec api npm run migrate:fresh
```

Masuk shell container MySQL:

```bash
docker compose exec db sh
```

Masuk client MySQL dari container DB:

```bash
docker compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD"
```

Swagger docs:

- UI: `http://localhost:3000/api-docs`
- JSON: `http://localhost:3000/api-docs.json`

## Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/logout`

#### Auth Flow

- `POST /api/auth/register`: register akun local (email + password)
- `POST /api/auth/login`: login akun local (email + password)
- `POST /api/auth/google`: login dengan Firebase ID token, auto-register jika user belum ada
- `POST /api/auth/logout`: revoke JWT internal

Contoh payload Google login:

```json
{
	"idToken": "<firebase-id-token>"
}
```

Catatan perilaku Google login:

- Backend memverifikasi ID token ke Firebase Admin SDK
- Data yang dipakai dari token: `uid`, `email`, `name`
- Jika user belum ada, user baru dibuat dengan `auth_provider=google` dan `password=null`
- Jika user sudah ada, backend tetap mengeluarkan JWT internal untuk API MoneyMate

### Transactions

- `GET /api/transactions?date=&type=&category=`
- `GET /api/transactions/:id`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

Notes:

- `GET /api/transactions` supports optional `page` and `limit` query params.
- `POST /api/transactions`: jika `budget_period_id` tidak dikirim, backend otomatis menggunakan default budget period user (jika ada).

### Categories

*(Categories are now user-scoped; users only see and edit their own categories)*

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

Notes:

- `GET /api/categories` supports optional `page` and `limit` query params.

### Budget Periods

- `GET /api/budget-periods`
- `POST /api/budget-periods`
- `PUT /api/budget-periods/:id`
- `POST /api/budget-periods/:id/set-default`
- `DELETE /api/budget-periods/:id`
- `GET /api/budget-periods/:id/daily-status?date=YYYY-MM-DD`

Notes:

- `GET /api/budget-periods` supports optional `page` and `limit` query params.
- `excluded_weekdays` menggunakan angka hari: `0=Sunday ... 6=Saturday`.
- Setiap user memiliki maksimal satu default budget period (`is_default=true`).

### Dashboard

- `GET /api/dashboard`

### Notifications

- `GET /api/notifications/vapid-key`
- `POST /api/notifications/subscribe`
- `DELETE /api/notifications/unsubscribe`
- `GET /api/notifications/history`
- `PATCH /api/notifications/history/:id/read`
- `PATCH /api/notifications/history/read-all`

Notes:

- Riwayat notifikasi hanya untuk user yang sedang login (JWT scope per user).
- `GET /api/notifications/history` mengembalikan maksimal 5 data terbaru + `unread_count`.
- Saat cron berjalan, histori tetap disimpan walaupun push ke device gagal.

## Notes

- Database schema now uses versioned Knex migrations (tracked in `knex_migrations` table).
- On server startup, `migrate:latest` is executed automatically.
- On server startup, database will be auto-created first if it does not exist.
- Seeder `002_dummy_user_budget_transactions.js` menambahkan data dummy:
	- User: `dummy@test.com` (password: `password123`)
	- Budget period: `Budget April 2026` (`2026-04-01` s/d `2026-04-30`, total `1000000`)
	- Income awal (gaji): `5500000` pada `2026-04-01`
	- Transaction tanggal `2026-04-01` s/d `2026-04-05`: `30000`, `50000`, `43000`, `63000`, `15000`
- Useful commands:
- `npm run migrate`
- `npm run migrate:rollback`
- `npm run migrate:fresh`
- `npm run migrate:make -- migration_name`
- `npm run seed`
- `npm run seed:make -- seed_name`
- Daily status is calculated in realtime from transactions and budget period settings.
- Lazy load list/table data utamanya di frontend (infinite scroll / load more), sedangkan backend men-support dengan pagination (`page`, `limit`) agar data diambil bertahap.
- Base budget is `0` on excluded weekdays (`excluded_weekdays`); carry-over remains active.
- Job notifikasi berjalan setiap hari jam `08:00` (timezone mengikuti server).

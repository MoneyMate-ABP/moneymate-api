# MoneyMate API

Backend for MoneyMate Expense Tracker using Express.js, JWT, and SQL (PostgreSQL/MySQL).

## Features

- JWT auth: register, login, logout (token revocation)
- Google login via Firebase ID token
- Default categories: Makanan, Transportasi, Hiburan, Lainnya
- Transactions: create, edit, delete, filter by date/type/category
- Budget periods: multiple active periods supported
- Realtime carry-over daily budget calculation
- Dashboard summary with budget status for today
- Daily 20:00 notification job baseline (cron)
- Optional geolocation for transactions

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

5. Database creation:

- If the DB does not exist yet, server startup will attempt to auto-create it (PostgreSQL/MySQL).
- The DB user in `.env` must have permission to create database.

6. Jalankan migration:

```bash
npm run migrate
```

7. Jalankan seed default data:

```bash
npm run seed
```

8. Run API in dev mode:

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
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Categories

- `GET /api/categories`

### Budget Periods

- `GET /api/budget-periods`
- `POST /api/budget-periods`
- `PUT /api/budget-periods/:id`
- `DELETE /api/budget-periods/:id`
- `GET /api/budget-periods/:id/daily-status?date=YYYY-MM-DD`

### Dashboard

- `GET /api/dashboard`

## Notes

- Database schema now uses versioned Knex migrations (tracked in `knex_migrations` table).
- On server startup, `migrate:latest` is executed automatically.
- On server startup, database will be auto-created first if it does not exist.
- Useful commands:
- `npm run migrate`
- `npm run migrate:rollback`
- `npm run migrate:fresh`
- `npm run migrate:make -- migration_name`
- `npm run seed`
- `npm run seed:make -- seed_name`
- Daily status is calculated in realtime from transactions and budget period settings.
- Weekend base budget is set to `0`; carry-over remains active.

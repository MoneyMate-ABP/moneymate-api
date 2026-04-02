# MoneyMate API

Backend for MoneyMate Expense Tracker using Express.js, JWT, and SQL (PostgreSQL/MySQL).

## Features

- JWT auth: register, login, logout (token revocation)
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

4. Database creation:

- If the DB does not exist yet, server startup will attempt to auto-create it (PostgreSQL/MySQL).
- The DB user in `.env` must have permission to create database.

5. Jalankan migration:

```bash
npm run migrate
```

6. Jalankan seed default data:

```bash
npm run seed
```

7. Run API in dev mode:

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
- `POST /api/auth/logout`

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

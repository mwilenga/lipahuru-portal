# Lipahuru Portal

Next.js operations console for Lipahuru Payment Gateway.

## Features

- **Super Admin** — onboard merchants, view all transactions
- **Merchant** — dashboard, wallets, collections, disbursements, transactions

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Portal runs at `http://localhost:3000`.

Ensure the Laravel API (`../core`) is running:

```bash
cd ../core
php artisan serve
```

Add to `core/.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Default logins

**Super Admin** (from seeder):
- Email: `admin@lipahuru.test`
- Password: `password`

**Merchant** — created when admin onboards a merchant (portal email/password shown once).

## API endpoints used

| Role | Endpoint |
|------|----------|
| Admin | `POST /api/admin/v1/login` |
| Admin | `GET/POST /api/admin/v1/merchants` |
| Admin | `GET /api/admin/v1/transactions` |
| Merchant | `POST /api/v1/merchant/login` |
| Merchant | `GET /api/v1/portal/dashboard` |
| Merchant | `GET /api/v1/portal/wallets` |
| Merchant | `GET /api/v1/portal/transactions` |

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

Portal runs at `http://localhost:3000` in development.

Ensure the Laravel API (`../core`) is running:

```bash
cd ../core
php artisan serve
```

Add to `core/.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Production (PM2 + nginx)

The portal runs on **port 3001** behind nginx. PM2 keeps the Next.js process alive.

### 1. Server prerequisites

```bash
# Node.js 20+ and PM2
npm install -g pm2
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your production API URL (**before build**):

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 3. Build and start with PM2

```bash
chmod +x deploy/deploy.sh
npm run deploy
```

Or manually:

```bash
npm install
npm run build
npm run pm2:start
pm2 save
pm2 startup   # run the command it prints, so PM2 survives reboots
```

Useful PM2 commands:

```bash
npm run pm2:restart
npm run pm2:stop
npm run pm2:logs
pm2 status
```

PM2 config: `ecosystem.config.cjs`  
Logs: `deploy/logs/`

### 4. Configure nginx

Copy and edit the example config:

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/lipahuru-portal
sudo nano /etc/nginx/sites-available/lipahuru-portal
# Set server_name to your domain

sudo ln -sf /etc/nginx/sites-available/lipahuru-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Nginx proxies public traffic to `http://127.0.0.1:3001` where PM2 runs Next.js.

### 5. Laravel API CORS

In `core/.env` on the API server:

```env
CORS_ALLOWED_ORIGINS=https://portal.yourdomain.com
```

Then:

```bash
php artisan config:clear
```

### 6. Redeploy after updates

```bash
git pull
npm run deploy
```

`NEXT_PUBLIC_API_URL` is embedded at **build time** — if you change it, run `npm run build` again before restarting PM2.

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

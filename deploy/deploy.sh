#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy .env.local.example and set NEXT_PUBLIC_API_URL first."
  exit 1
fi

mkdir -p deploy/logs

echo "Installing dependencies..."
npm install

echo "Building portal..."
npm run build

echo "Starting / restarting PM2..."
if pm2 describe lipahuru-portal >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "Done. Portal should be running on http://127.0.0.1:3001"
echo "Check status: pm2 status lipahuru-portal"
echo "View logs:    pm2 logs lipahuru-portal"

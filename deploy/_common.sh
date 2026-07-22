#!/usr/bin/env bash
# Shared helpers for portal deploy scripts.
# shellcheck disable=SC2034

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_NAME="${1:-}"
APP_NAME="${2:-}"
PORT="${3:-}"

if [[ -z "$ENV_NAME" || -z "$APP_NAME" || -z "$PORT" ]]; then
  echo "Usage: source deploy/_common.sh <sandbox|prod> <pm2-app-name> <port>"
  exit 1
fi

ENV_FILE=".env.${ENV_NAME}"
EXAMPLE_FILE=".env.${ENV_NAME}.example"

prepare_env() {
  if [[ -f "$ENV_FILE" ]]; then
    echo "Using ${ENV_FILE} → .env.local (Next.js build input)"
    cp "$ENV_FILE" .env.local
  elif [[ -f .env.local ]]; then
    echo "Using existing .env.local"
  else
    echo "Missing ${ENV_FILE} (or .env.local)."
    if [[ -f "$EXAMPLE_FILE" ]]; then
      echo "Copy ${EXAMPLE_FILE} to ${ENV_FILE} and set NEXT_PUBLIC_API_URL."
    else
      echo "Create ${ENV_FILE} with NEXT_PUBLIC_API_URL=..."
    fi
    exit 1
  fi

  if ! grep -q '^NEXT_PUBLIC_API_URL=' .env.local; then
    echo "NEXT_PUBLIC_API_URL is required in .env.local / ${ENV_FILE}"
    exit 1
  fi
}

install_and_build() {
  mkdir -p deploy/logs

  echo "Installing dependencies..."
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  echo "Building portal (${ENV_NAME})..."
  npm run build
}

start_or_restart_pm2() {
  echo "Starting / restarting PM2 app: ${APP_NAME}"

  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    pm2 start ecosystem.config.cjs --only "$APP_NAME"
  fi

  pm2 save
}

print_done() {
  echo ""
  echo "Done. ${ENV_NAME} portal should be running on http://127.0.0.1:${PORT}"
  echo "Check status: pm2 status ${APP_NAME}"
  echo "View logs:    pm2 logs ${APP_NAME}"
}

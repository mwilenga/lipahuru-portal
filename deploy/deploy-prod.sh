#!/usr/bin/env bash
set -euo pipefail

# Deploy LipaHuru portal — production (PM2: lipahuru-portal-prod, port 3001)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./_common.sh
source "${SCRIPT_DIR}/_common.sh" prod lipahuru-portal-prod 3001

echo "=== LipaHuru Portal · PROD deploy ==="
prepare_env
install_and_build
start_or_restart_pm2
print_done

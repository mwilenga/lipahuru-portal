#!/usr/bin/env bash
set -euo pipefail

# Deploy LipaHuru portal — sandbox (PM2: lipahuru-portal-sandbox, port 3002)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./_common.sh
source "${SCRIPT_DIR}/_common.sh" sandbox lipahuru-portal-sandbox 3002

echo "=== LipaHuru Portal · SANDBOX deploy ==="
prepare_env
install_and_build
start_or_restart_pm2
print_done

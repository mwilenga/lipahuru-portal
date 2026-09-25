#!/usr/bin/env bash
set -euo pipefail

# Deploy LipaHuru portal — UAT (PM2: lipahuru-portal-uat, port 3002)
# Use the uat branch (same code as main).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./_common.sh
source "${SCRIPT_DIR}/_common.sh" uat lipahuru-portal-uat 3002

echo "=== LipaHuru Portal · UAT deploy ==="
prepare_env
install_and_build
start_or_restart_pm2
print_done

#!/usr/bin/env bash
set -euo pipefail

# Alias du déploiement backup-cron (Lambda + EventBridge via CloudFormation).
# Même interface que deploy-backup-cron.sh pour rester aligné avec la doc.
#
# Usage :
#   ./deploy-crons.sh <environment> <api-url> <cron-secret> [schedule-expression]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/deploy-backup-cron.sh" "$@"

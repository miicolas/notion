#!/usr/bin/env bash
set -euo pipefail
# Lambda backup-cron + CloudFormation via AWS SDK (Bun) — plus d’AWS CLI.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
exec bun "$SCRIPT_DIR/deploy-aws.ts" backup-cron "$@"

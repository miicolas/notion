#!/usr/bin/env bash
set -euo pipefail
# Sync statique vers S3 via AWS SDK (Bun) — plus d’AWS CLI.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
[[ $# -ge 2 ]] || { echo "Usage: $0 <local-dir> <s3-bucket> [prefix]"; exit 1; }
exec bun "$SCRIPT_DIR/deploy-aws.ts" assets "$@"

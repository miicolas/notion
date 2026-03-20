#!/usr/bin/env bash
set -euo pipefail
# Déploiement Lambda via AWS SDK (Bun) — plus d’AWS CLI.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
[[ -n "${LAMBDA_ENV_VARS:-}" ]] && export LAMBDA_ENV_VARS
exec bun "$SCRIPT_DIR/deploy-aws.ts" api "${1:?Usage: $0 <lambda-function-name>}"

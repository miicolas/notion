#!/usr/bin/env bash
set -euo pipefail
# S3 + CloudFront via AWS SDK (Bun) — plus d’AWS CLI.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
[[ $# -ge 3 ]] || { echo "Usage: $0 <dist-dir> <s3-bucket> <cloudfront-id>"; exit 1; }
exec bun "$SCRIPT_DIR/deploy-aws.ts" frontend "$@"

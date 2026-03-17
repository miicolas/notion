#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="$1"
S3_BUCKET="$2"
CLOUDFRONT_ID="$3"

if [[ -z "$DIST_DIR" || -z "$S3_BUCKET" || -z "$CLOUDFRONT_ID" ]]; then
  echo "Usage: $0 <dist-dir> <s3-bucket> <cloudfront-id>"
  exit 1
fi

echo "Syncing hashed assets with immutable cache..."
aws s3 sync "$DIST_DIR/assets" "s3://$S3_BUCKET/assets" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

echo "Syncing root files with no-cache..."
aws s3 sync "$DIST_DIR" "s3://$S3_BUCKET" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "assets/*" \
  --delete

echo "Invalidating CloudFront distribution..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_ID" \
  --paths "/*"

echo "Deploy complete."

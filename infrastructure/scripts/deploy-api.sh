#!/usr/bin/env bash
set -euo pipefail

LAMBDA_NAME="$1"

if [[ -z "$LAMBDA_NAME" ]]; then
  echo "Usage: $0 <lambda-function-name>"
  exit 1
fi

echo "Building Lambda bundle..."
cd apps/api
bun run build:lambda

echo "Creating deployment package..."
cd dist
zip -j lambda.zip index.js

echo "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb://lambda.zip

echo "Waiting for function update to complete..."
aws lambda wait function-updated --function-name "$LAMBDA_NAME"

if [[ -n "${LAMBDA_ENV_VARS:-}" ]]; then
  echo "Merging Lambda environment variables..."

  EXISTING=$(aws lambda get-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --query "Environment.Variables" --output json 2>/dev/null || echo "{}")

  MERGED=$(echo "$EXISTING" "$LAMBDA_ENV_VARS" | jq -s '.[0] * .[1]')

  aws lambda update-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --environment "{\"Variables\":${MERGED}}"
fi

echo "Deploy complete."

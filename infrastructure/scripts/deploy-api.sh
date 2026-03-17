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

echo "Deploy complete."

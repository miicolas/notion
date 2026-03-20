#!/usr/bin/env bash
set -euo pipefail

# Deploy the backup-cron Lambda and EventBridge schedule
#
# Usage:
#   ./deploy-backup-cron.sh <environment> <api-url> <cron-secret> [schedule-expression]
#
# Examples:
#   ./deploy-backup-cron.sh staging https://api.staging.example.com my-secret-token
#   ./deploy-backup-cron.sh production https://api.example.com my-secret-token "rate(6 hours)"
#   ./deploy-backup-cron.sh production https://api.example.com my-secret-token "cron(0 2 * * ? *)"

ENVIRONMENT="${1:?Usage: $0 <environment> <api-url> <cron-secret> [schedule-expression]}"
API_URL="${2:?Missing API_URL}"
CRON_SECRET="${3:?Missing CRON_SECRET}"
SCHEDULE_EXPRESSION="${4:-rate(1 hour)}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$INFRA_DIR/lambda/backup-cron"
REGION="eu-west-1"

# Read region from config if available
CONFIG_FILE="$INFRA_DIR/environments/$ENVIRONMENT/config.json"
if [ -f "$CONFIG_FILE" ]; then
  REGION=$(jq -r '.aws.region // "eu-west-1"' "$CONFIG_FILE")
fi

S3_BUCKET="${ENVIRONMENT}-lambda-deployments-$(aws sts get-caller-identity --query Account --output text)"
S3_KEY="lambda/backup-cron.zip"
STACK_NAME="${ENVIRONMENT}-backup-cron"

echo "==> Packaging Lambda..."
TEMP_DIR=$(mktemp -d)
cp "$LAMBDA_DIR/index.mjs" "$TEMP_DIR/"
cd "$TEMP_DIR"
zip -j backup-cron.zip index.mjs
cd -

echo "==> Ensuring S3 bucket exists..."
aws s3 mb "s3://$S3_BUCKET" --region "$REGION" 2>/dev/null || true

echo "==> Uploading Lambda package to S3..."
aws s3 cp "$TEMP_DIR/backup-cron.zip" "s3://$S3_BUCKET/$S3_KEY" --region "$REGION"

echo "==> Deploying CloudFormation stack: $STACK_NAME..."
aws cloudformation deploy \
  --template-file "$INFRA_DIR/cloudformation/backup-cron.yml" \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
    ApiUrl="$API_URL" \
    CronSecret="$CRON_SECRET" \
    ScheduleExpression="$SCHEDULE_EXPRESSION" \
    LambdaS3Bucket="$S3_BUCKET" \
    LambdaS3Key="$S3_KEY"

echo "==> Cleaning up..."
rm -rf "$TEMP_DIR"

echo "==> Done! Stack: $STACK_NAME deployed in $REGION"
echo "    Schedule: $SCHEDULE_EXPRESSION"
echo "    API URL:  $API_URL"

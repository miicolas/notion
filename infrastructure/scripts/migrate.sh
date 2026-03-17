#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_DIR="$SCRIPT_DIR/../../apps/api/migrations"

echo "Running migrations against database..."

for sql_file in "$SQL_DIR"/*.sql; do
  if [[ -f "$sql_file" ]]; then
    echo "Applying: $(basename "$sql_file")"
    psql "$DATABASE_URL" -f "$sql_file" -v ON_ERROR_STOP=1
  fi
done

echo "Migrations complete."

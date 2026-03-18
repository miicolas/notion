#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_DIR="$SCRIPT_DIR/../../apps/api/migrations"

echo "Running migrations against database..."

# Create migrations tracking table if it doesn't exist
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL

# Seed existing migrations that were applied before tracking was added
# Check if any migration is tracked; if not, detect already-applied migrations
TRACKED_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM _migrations" 2>/dev/null)

if [[ "$TRACKED_COUNT" == "0" ]]; then
  echo "No migrations tracked yet, detecting already-applied migrations..."
  for sql_file in "$SQL_DIR"/*.sql; do
    if [[ -f "$sql_file" ]]; then
      migration_name="$(basename "$sql_file")"
      # Try applying; if it fails (table already exists), mark as applied and continue
      if psql "$DATABASE_URL" -f "$sql_file" -v ON_ERROR_STOP=1 2>/dev/null; then
        echo "Applied: $migration_name"
      else
        echo "Already applied (detected): $migration_name"
      fi
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
        "INSERT INTO _migrations (name) VALUES ('$migration_name') ON CONFLICT DO NOTHING"
    fi
  done
  echo "Migrations complete."
  exit 0
fi

for sql_file in "$SQL_DIR"/*.sql; do
  if [[ -f "$sql_file" ]]; then
    migration_name="$(basename "$sql_file")"

    already_applied=$(psql "$DATABASE_URL" -tAc \
      "SELECT 1 FROM _migrations WHERE name = '$migration_name'" 2>/dev/null)

    if [[ "$already_applied" == "1" ]]; then
      echo "Skipping (already applied): $migration_name"
      continue
    fi

    echo "Applying: $migration_name"
    psql "$DATABASE_URL" -f "$sql_file" -v ON_ERROR_STOP=1

    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
      "INSERT INTO _migrations (name) VALUES ('$migration_name')"
  fi
done

echo "Migrations complete."

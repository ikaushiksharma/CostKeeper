#!/usr/bin/env bash
# Copy the production database into the local Docker Postgres.
#
# Reads prod only (pg_dump), then replaces everything in the local
# `costkeeper` database with that snapshot. Prod is never written to.
# The prod URL comes from DATABASE_URL in .env.local and is never printed.
set -euo pipefail

cd "$(dirname "$0")/.."

PROD_URL=$(grep -E '^DATABASE_URL=' .env.local | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')
if [[ -z "${PROD_URL}" ]]; then
    echo "DATABASE_URL not found in .env.local" >&2
    exit 1
fi
if [[ "${PROD_URL}" == *localhost* || "${PROD_URL}" == *localtest.me* ]]; then
    echo "DATABASE_URL in .env.local points at a local database, not prod." >&2
    exit 1
fi

if ! docker compose ps --status running postgres | grep -q costkeeper-postgres; then
    echo "Starting local database..."
    docker compose up -d --wait postgres neon-proxy
fi

echo "Resetting local costkeeper database..."
docker compose exec -T postgres psql -U postgres -d postgres -q \
    -c "DROP DATABASE IF EXISTS costkeeper WITH (FORCE);" \
    -c "CREATE DATABASE costkeeper;"

echo "Streaming prod (read-only pg_dump) into local..."
# Same major version as prod (16). --no-owner/--no-privileges drop Neon roles.
# The dump is piped straight into pg_restore, so nothing is written to disk.
docker run --rm -i -e PROD_URL="${PROD_URL}" postgres:16-alpine \
    sh -c 'pg_dump "$PROD_URL" --format=custom --no-owner --no-privileges' |
    docker compose exec -T postgres pg_restore -U postgres -d costkeeper \
        --no-owner --no-privileges --exit-on-error

echo
echo "Row counts in the local copy:"
docker compose exec -T postgres psql -U postgres -d costkeeper -c "
    SELECT 'accounts' AS table, count(*) FROM accounts
    UNION ALL SELECT 'categories', count(*) FROM categories
    UNION ALL SELECT 'transactions', count(*) FROM transactions
    UNION ALL SELECT 'settings', count(*) FROM settings
    UNION ALL SELECT 'telegram_users', count(*) FROM telegram_users;"
echo "Done. Run 'bun run dev:local' to use it."

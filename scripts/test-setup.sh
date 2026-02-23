#!/usr/bin/env bash
set -euo pipefail

# Start test Postgres with ephemeral port, write DATABASE_URL to .env.test, run migrations.
# When DATABASE_URL is already set (e.g. CI), skip Docker and only run migrations.
# .env.test is generated here and gitignored; after a fresh clone run: bun run test:setup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

if [ -n "${DATABASE_URL:-}" ]; then
  # CI or caller already provided DB; just run migrations
  bun run scripts/migrate-test.ts
  exit 0
fi

docker compose -f docker-compose.test.yml down --volumes 2>/dev/null || true
docker compose -f docker-compose.test.yml up -d --wait

# Resolve Postgres container ID (avoids hardcoding project-based name like "recall-postgres-1")
CONTAINER=$(docker compose -f docker-compose.test.yml ps -q postgres)
if [ -z "$CONTAINER" ]; then
  echo "Failed to get test Postgres container ID" >&2
  exit 1
fi
PORT=$(docker port "$CONTAINER" 5432/tcp 2>/dev/null | cut -d: -f2)
if [ -z "$PORT" ]; then
  echo "Failed to get test Postgres port from container $CONTAINER" >&2
  exit 1
fi

DATABASE_URL="postgresql://test:test@localhost:${PORT}/test_db"
if [ -f .env.test ]; then
  if grep -q "^DATABASE_URL=" .env.test; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.test
    else
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.test
    fi
  else
    echo "DATABASE_URL=${DATABASE_URL}" >> .env.test
  fi
else
  echo "# Written by test:setup (ephemeral port)" > .env.test
  echo "DATABASE_URL=${DATABASE_URL}" >> .env.test
fi

export DATABASE_URL
bun run scripts/migrate-test.ts

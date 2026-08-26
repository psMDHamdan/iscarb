#!/usr/bin/env sh
# Apply Prisma migrations — run as an explicit deploy step, NOT at container boot.
# Usage (from repo root, with DATABASE_URL set):
#   sh scripts/migrate-deploy.sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

echo "[migrate-deploy] Applying Prisma migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma
echo "[migrate-deploy] Done."

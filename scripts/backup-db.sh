#!/usr/bin/env sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="globaledunova_${TIMESTAMP}.sql"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Creating backup: ${BACKUP_DIR}/${FILENAME}"
pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/${FILENAME}"

echo "Backup complete: ${BACKUP_DIR}/${FILENAME}"

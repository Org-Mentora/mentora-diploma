#!/bin/sh
set -eu

: "${MONGO_BACKUP_URI:?MONGO_BACKUP_URI is required}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/mentora-$stamp.archive.gz"
partial="$target.partial"

echo "backup: dumping to $target"
mongodump --uri="$MONGO_BACKUP_URI" --db="${MONGO_DATABASE:-mentora}" --gzip --archive="$partial" --quiet
mv "$partial" "$target"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$target")" > "$(basename "$target").sha256")
echo "backup: done ($(du -h "$target" | cut -f1))"

find "$BACKUP_DIR" -name 'mentora-*.archive.gz*' -type f -mtime +"$RETENTION_DAYS" -print -delete

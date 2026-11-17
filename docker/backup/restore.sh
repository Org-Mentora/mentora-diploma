#!/bin/sh
set -eu

: "${MONGO_BACKUP_URI:?MONGO_BACKUP_URI is required}"
archive="${1:?usage: restore.sh <path to mentora-*.archive.gz>}"
database="${MONGO_DATABASE:-mentora}"

if [ -f "$archive.sha256" ]; then
  (cd "$(dirname "$archive")" && sha256sum -c "$(basename "$archive").sha256")
fi

echo "restore: replaying $archive into $database (its collections are dropped first)"
mongorestore --uri="$MONGO_BACKUP_URI" --drop --gzip --archive="$archive" \
  --nsInclude="$database.*"
echo "restore: done"

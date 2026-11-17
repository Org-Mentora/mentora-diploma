#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose "$@")
counts='["patients","professionals","appointments","subscriptions","clinical_records"].map(c => c + "=" + db.getCollection(c).countDocuments()).join(" ")'
root_eval() {
  "${compose[@]}" exec -T mongo sh -c \
    'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin mentora --eval "$1"' \
    _ "$1"
}

before=$(root_eval "$counts")
echo "drill: before  $before"

"${compose[@]}" exec -T backup sh /scripts/backup.sh
archive=$("${compose[@]}" exec -T backup sh -c 'ls -1t /backups/mentora-*.archive.gz | head -1')
echo "drill: archive $archive"

root_eval 'db.patients.deleteMany({}); db.appointments.deleteMany({}); "data removed"'
"${compose[@]}" exec -T backup sh /scripts/restore.sh "$archive"

after=$(root_eval "$counts")
echo "drill: after   $after"
if [ "$before" != "$after" ]; then
  echo "drill: FAILED, counts differ" >&2
  exit 1
fi
echo "drill: restore verified"

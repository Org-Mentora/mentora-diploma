#!/bin/sh
set -eu

INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
echo "backup: every ${INTERVAL_HOURS}h, keeping ${BACKUP_RETENTION_DAYS:-14} days"
while true; do
  sh /scripts/backup.sh || echo "backup: FAILED" >&2
  sleep $((INTERVAL_HOURS * 3600))
done

#!/bin/sh
set -eu
if [ ! -s /keys/keyfile ]; then
  head -c 756 /dev/urandom | base64 | tr -d '\n' > /keys/keyfile
fi
chmod 400 /keys/keyfile
chown 999:999 /keys/keyfile

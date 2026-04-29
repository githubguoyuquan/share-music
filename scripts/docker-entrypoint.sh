#!/usr/bin/env sh
set -eu

cd /app

if [ -z "${DATABASE_URL:-}" ]; then
  echo "docker-entrypoint: DATABASE_URL is required" >&2
  exit 1
fi

# Align schema with DB before serving (repo uses migrate-free db push in dev).
prisma db push

unset NODE_PATH

exec node server.js

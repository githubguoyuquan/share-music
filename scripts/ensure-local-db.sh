#!/usr/bin/env bash
# Local Postgres for development.
# - Default: try Podman container (needs a working container stack).
# - USE_SYSTEM_PG=1 or no podman / podman fails: wait for system PostgreSQL on 127.0.0.1:5432 (no CPU virtualization).
set -euo pipefail
NAME="music-share-pg"
IMAGE="docker.io/library/postgres:16"

print_system_help() {
  echo "" >&2
  echo "Use Fedora system PostgreSQL (no VM / virtualization required):" >&2
  echo "  podman stop music-share-pg 2>/dev/null || true" >&2
  echo "  sudo systemctl enable --now postgresql" >&2
  echo "  sudo -u postgres psql -c \"CREATE DATABASE music_share;\"" >&2
  echo "  sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" >&2
  echo "  (password must match DATABASE_URL in .env)" >&2
  echo "  cd \"$(dirname "$0")/..\" && npx prisma db push && npm run seed" >&2
}

wait_for_system_postgres() {
  local i
  if ! command -v pg_isready >/dev/null 2>&1; then
    echo "Install client tools: sudo dnf install -y postgresql" >&2
    print_system_help
    return 1
  fi
  for i in $(seq 1 30); do
    if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
      echo "PostgreSQL is ready on 127.0.0.1:5432."
      return 0
    fi
    sleep 1
  done
  echo "Timed out: nothing is listening on 127.0.0.1:5432." >&2
  print_system_help
  return 1
}

use_system_only() {
  wait_for_system_postgres
}

if [[ "${USE_SYSTEM_PG:-}" == "1" ]]; then
  use_system_only
  exit 0
fi

if ! command -v podman >/dev/null 2>&1; then
  echo "podman not installed — using system PostgreSQL on 5432." >&2
  use_system_only
  exit 0
fi

podman_ok=0
if podman inspect "$NAME" >/dev/null 2>&1; then
  if podman start "$NAME" >/dev/null 2>&1; then
    echo "Started existing container: $NAME"
    podman_ok=1
  else
    echo "Could not start Podman container (often happens without working virtualization)." >&2
  fi
else
  if podman run -d --name "$NAME" \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=music_share \
    -p 5432:5432 \
    "$IMAGE" >/dev/null 2>&1; then
    echo "Created and started: $NAME"
    podman_ok=1
  else
    echo "Podman could not run the database container." >&2
  fi
fi

if [[ "$podman_ok" == "1" ]]; then
  for _ in $(seq 1 30); do
    if podman exec "$NAME" pg_isready -U postgres -d music_share >/dev/null 2>&1; then
      echo "Postgres is ready (Podman)."
      exit 0
    fi
    sleep 1
  done
  echo "Podman Postgres did not become ready — falling back to system PostgreSQL." >&2
fi

use_system_only

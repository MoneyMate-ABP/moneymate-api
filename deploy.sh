#!/usr/bin/env bash
set -euo pipefail

# Auto-deploy MoneyMate API without resetting database data.
# This script updates code, rebuilds API container, and runs migrate:latest only.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${1:-main}"
COMPOSE_BIN=""

log() {
  printf "\n[%s] %s\n" "$(date +"%Y-%m-%d %H:%M:%S")" "$1"
}

run() {
  log "$1"
  shift
  "$@"
}

detect_compose_bin() {
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_BIN="docker-compose"
    return
  fi

  echo "Error: 'docker-compose' is not available." >&2
  exit 1
}

compose() {
  docker-compose "$@"
}

cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed." >&2
  exit 1
fi

detect_compose_bin
log "Using compose command: $COMPOSE_BIN"

if [ ! -f "docker-compose.yml" ]; then
  echo "Error: docker-compose.yml not found in $PROJECT_DIR" >&2
  exit 1
fi

if [ ! -f ".env.docker" ]; then
  echo "Error: .env.docker not found in $PROJECT_DIR" >&2
  exit 1
fi

run "Fetching latest git changes" git fetch origin "$BRANCH"
run "Checking out branch $BRANCH" git checkout "$BRANCH"
run "Pulling latest commit (fast-forward only)" git pull --ff-only origin "$BRANCH"

log "Building and starting API container (database volume is preserved)"
if ! compose up -d --build api; then
  log "Compose up failed. Attempting safe recovery for legacy ContainerConfig error..."
  compose rm -sf api || true
  compose up -d --build --no-deps api
fi

run "Ensuring DB service is running" compose up -d db

run "Running migrate:latest (no reset)" compose exec -T api npm run migrate

run "Deployment complete. Current container status:" compose ps

log "Done. Database data is preserved (no migrate:fresh / no volume deletion)."

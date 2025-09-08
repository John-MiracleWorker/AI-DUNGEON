#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cleanup() {
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    docker compose -f "$ROOT_DIR/docker-compose.dev.yml" down >/dev/null 2>&1 || true
}

trap 'cleanup; exit 0' INT TERM

cd "$ROOT_DIR"
docker compose -f docker-compose.dev.yml up -d mongodb redis

(
    cd "$ROOT_DIR/backend" && npm run dev
) &
BACKEND_PID=$!

(
    cd "$ROOT_DIR/frontend" && npx expo start --port 8082
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
cleanup

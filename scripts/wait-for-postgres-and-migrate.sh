#!/bin/bash
set -e

echo "⏳ Waiting for Postgres to be ready inside the container..."

docker exec littlesteps-dev sh -c '
  set -e
  HOST="db"
  PORT="5432"
  RETRIES=10

  for i in $(seq 1 $RETRIES); do
    nc -z $HOST $PORT && echo "✅ Postgres is ready!" && break
    echo "  🔁 Still waiting ($i/$RETRIES)..."
    sleep 2
  done

  if [ "$i" = "$RETRIES" ]; then
    echo "❌ Timed out waiting for Postgres!"
    exit 1
  fi

  echo "🚀 Running database migration..."
  pnpm drizzle-kit migrate
'

#!/bin/sh
set -e
if [ "${RUN_MIGRATIONS:-1}" = "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  if [ -d ./prisma/migrations ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
    npx prisma migrate deploy
  else
    npx prisma db push
  fi
fi
exec "$@"

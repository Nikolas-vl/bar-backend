#!/bin/bash
# Runs once, when the postgres_data volume is empty (official image entrypoint).
#
# The application database ($POSTGRES_DB) is created by the image itself and is
# managed exclusively by Prisma migrations — nothing is created in it here.
#
# This script creates the separate AI / pgvector experiments database
# ($POSTGRES_AI_DB), enables the `vector` extension in it and creates the
# learning tables.
set -euo pipefail

AI_DB="${POSTGRES_AI_DB:-jolie_ai}"

echo "initdb: creating AI database '${AI_DB}'"
echo 'CREATE DATABASE :"ai_db";' | psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v ai_db="$AI_DB"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$AI_DB" \
  -f /docker-entrypoint-initdb.d/sql/ai-lab-schema.sql

echo "initdb: AI database '${AI_DB}' ready"

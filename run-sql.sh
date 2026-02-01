#!/bin/bash
# Run SQL migration via Supabase Management API

source .env.local

PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

echo "Running SQL migration for project: $PROJECT_REF"

# Read SQL file and execute via psql-style connection
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

# Try using supabase db execute
cd /Users/trunks/Flacko_AI/flacko-ai

cat dashboard_data_table.sql | supabase db execute --project-ref "$PROJECT_REF" --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" 2>&1 || \
psql "postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f dashboard_data_table.sql 2>&1 || \
echo "

Manual SQL execution required. Please run this in Supabase SQL Editor:
$(cat dashboard_data_table.sql)
"

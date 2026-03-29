#!/bin/bash
# Ingest today's report into Axelrod's knowledge base
cd /Users/trunks/Flacko_AI/flacko-ai
TODAY=$(TZ=America/Chicago date +%Y-%m-%d)
echo "📚 Ingesting report for $TODAY..."
npx tsx scripts/ingest-reports.ts --since "$TODAY" 2>&1

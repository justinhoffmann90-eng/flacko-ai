#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/trunks/Flacko_AI/flacko-ai
set -a
source .env.local
set +a
exec /opt/homebrew/bin/pnpm tsx scripts/start-bot.ts

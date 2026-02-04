#!/bin/bash
cd ~/Flacko_AI/flacko-ai

# Export env vars from .env.local
set -a
source .env.local
set +a

# Run the bot
npx tsx scripts/start-bot.ts

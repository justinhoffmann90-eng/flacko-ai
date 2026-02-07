#!/bin/bash
# Setup script for Paper Flacko Bot

echo "⚔️ Setting up Paper Flacko..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from flacko-ai directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install yahoo-finance2

# Check environment variables
echo "🔍 Checking environment..."
missing=()

if [ -z "$SUPABASE_URL" ]; then
    missing+=("SUPABASE_URL")
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    missing+=("SUPABASE_SERVICE_KEY")
fi

if [ -z "$PAPER_TRADER_DISCORD_TOKEN" ]; then
    missing+=("PAPER_TRADER_DISCORD_TOKEN")
fi

if [ -z "$PAPER_TRADER_CHANNEL_ID" ]; then
    missing+=("PAPER_TRADER_CHANNEL_ID")
fi

if [ ${#missing[@]} -gt 0 ]; then
    echo "⚠️  Missing environment variables:"
    for var in "${missing[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Add these to your .env.local file:"
    echo "export SUPABASE_URL=your_supabase_url"
    echo "export SUPABASE_SERVICE_KEY=your_service_key"
    echo "export PAPER_TRADER_DISCORD_TOKEN=your_discord_token"
    echo "export PAPER_TRADER_CHANNEL_ID=your_channel_id"
    echo "export SPOT_GAMMA_API_KEY=your_spotgamma_key  # optional"
else
    echo "✅ All environment variables set"
fi

echo ""
echo "📋 Next steps:"
echo "1. Run schema.sql in Supabase SQL Editor"
echo "2. Test with: npm run paper-trader:once"
echo "3. Start bot: npm run paper-trader:start"
echo ""
echo "⚔️ Paper Flacko ready for battle!"

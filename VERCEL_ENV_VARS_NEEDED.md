# Required Vercel Environment Variables

## Discord Bot (CRITICAL - Role Assignment Broken Without These)

**Get values from `.env.local.temp` file:**

```bash
DISCORD_BOT_TOKEN=<from .env.local.temp>
DISCORD_GUILD_ID=<from .env.local.temp>
DISCORD_SUBSCRIBER_ROLE_ID=<from .env.local.temp>
```

## How to Add (Vercel Dashboard)

1. Go to: https://vercel.com/justins-projects-66e6a314/flacko-ai/settings/environment-variables
2. Add each variable above
3. Select: Production, Preview, Development
4. Click "Save"
5. Trigger redeploy: `vercel --prod` or push to main

## Why This Fixes Role Sync

- Cron endpoint `/api/cron/sync-discord-roles` runs on Vercel
- Without bot token, it can't assign roles (fails silently)
- Once vars are set, roles will be assigned within 2 min of user joining

---

Created: 2026-01-31 7:07 PM CT

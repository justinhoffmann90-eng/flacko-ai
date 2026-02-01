# Supabase Auth Email Configuration Needed

## Problem
- Users cannot reset passwords
- Email verification emails not being sent  
- Password reset flow completely broken

## Root Cause
Supabase auth emails are NOT configured. Two options:

### Option 1: Use Resend (Recommended)
1. Go to: https://supabase.com/dashboard/project/rctbqtemkahdbifxrqom/settings/auth
2. Scroll to "SMTP Settings"
3. Enable "Enable Custom SMTP"
4. Configure:
   - Host: `smtp.resend.com`
   - Port: `465` or `587`
   - User: `resend`
   - Password: `<RESEND_API_KEY from .env.local>`
   - Sender email: `alerts@flacko.ai`
   - Sender name: `Flacko AI`

### Option 2: Use Supabase Built-in (Quick Fix)
1. Go to: https://supabase.com/dashboard/project/rctbqtemkahdbifxrqom/settings/auth
2. Ensure "Enable email confirmations" is ON
3. Check rate limits aren't exceeded

## Test After Fix
```bash
# Test password reset
curl -X POST https://rctbqtemkahdbifxrqom.supabase.co/auth/v1/recover \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Affected Users (Manual Password Resets Done)
- jshimpfky@gmail.com - Temp password: `FlackoTemp2026!`
- (others as needed)

---

Created: 2026-01-31 7:12 PM CT

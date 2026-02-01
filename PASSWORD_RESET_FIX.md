# Password Reset "Auth Session Missing" Fix

## The Bug

Users were getting "auth session missing" error after clicking password reset links and submitting the password form.

## Root Cause

Supabase recovery links work like this:

1. Email contains link: `https://supabase.co/auth/v1/verify?token=XXX&redirect_to=YOUR_URL`
2. Supabase processes the token
3. Supabase redirects to YOUR_URL with tokens in **URL FRAGMENT**: `YOUR_URL#access_token=XXX&refresh_token=YYY`

The original code had a race condition:

```typescript
// Extract tokens from fragment
const hashParams = new URLSearchParams(hash.substring(1));
const { data } = await supabase.auth.setSession({ access_token, refresh_token });

// IMMEDIATELY clear the hash (BUG!)
window.history.replaceState(null, "", "/reset-password");
```

**Problem:** `setSession()` stores the session in memory instantly, but persisting to **cookies** is async. By clearing the hash immediately, the page might re-render before cookies are written. When the user submits the password form, `updateUser()` looks for the session in cookies and doesn't find it → "auth session missing"

## Failed Fix Attempt (commits 64b5dec, e753559)

Attempted to use server-side `/api/auth/callback` route to handle tokens.

**Why this failed:** URL fragments are **never sent to the server**. The server-side callback couldn't see the tokens, so users were redirected to `/reset-password` with NO session at all.

## The Correct Fix (commit 4033833)

Keep client-side token handling but **wait for session persistence before clearing the hash**:

```typescript
const { data } = await supabase.auth.setSession({ access_token, refresh_token });

// Set up listener BEFORE showing form
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // NOW session is persisted to cookies - safe to clear hash
    window.history.replaceState(null, "", "/reset-password");
    subscription.unsubscribe();
  }
});

// Show form immediately (session exists in memory for updateUser)
setPageState("form");
```

**Key insight:** The session exists in memory immediately after `setSession()`, so `updateUser()` will work. The `onAuthStateChange` listener ensures we only clear the hash AFTER cookies are written.

## How to Test

1. Request password reset at `/forgot-password`
2. Click link in email
3. Should see password form (not error)
4. Enter new password
5. Should successfully update (not "auth session missing")
6. Should redirect to dashboard

## Affected Flows

This fix applies to:
- ✅ Password reset (forgot password)
- ✅ Initial password setup (new signups via Stripe)
- ✅ Admin-generated password links

All use the same recovery link mechanism.

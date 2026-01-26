import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // @ts-ignore - bypass strict typing
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

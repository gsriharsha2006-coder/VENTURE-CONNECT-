import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, warnIfSupabaseMissing } from "@/lib/supabase/isConfigured";

export type BrowserSupabaseClient = SupabaseClient;

export function createSupabaseBrowserClient(): BrowserSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    warnIfSupabaseMissing("Supabase browser client");
    return null;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Backward-compatible alias for the earlier MVP helper. */
export const createBrowserSupabase = createSupabaseBrowserClient;

export const authRedirectTo = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

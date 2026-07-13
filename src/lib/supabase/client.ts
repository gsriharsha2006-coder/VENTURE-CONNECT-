import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { isSupabaseConfigured, warnIfSupabaseMissing } from "@/lib/supabase/isConfigured";

export type BrowserSupabaseClient = SupabaseClient;

let browserClient: BrowserSupabaseClient | null = null;

export function createSupabaseBrowserClient(): BrowserSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    warnIfSupabaseMissing("Supabase browser client");
    return null;
  }

  if (browserClient) return browserClient;
  const { url, publishableKey } = getSupabasePublicConfig();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}

/** Backward-compatible alias for the earlier MVP helper. */
export const createBrowserSupabase = createSupabaseBrowserClient;

export const authRedirectTo = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

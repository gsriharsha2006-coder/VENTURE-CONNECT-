import { getSupabasePublicConfig } from "@/lib/supabase/config";

const SUPABASE_WARNING =
  "Supabase is not configured. Venture Connect is running with mock/demo data. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY is temporarily supported).";

let warned = false;

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabasePublicConfig();
  return hasValue(url) && hasValue(publishableKey);
}

export function isSupabaseServiceConfigured() {
  return isSupabaseConfigured() && hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function warnIfSupabaseMissing(context = "Venture Connect") {
  if (isSupabaseConfigured() || process.env.NODE_ENV !== "development" || warned) return;
  warned = true;
  console.warn(`[${context}] ${SUPABASE_WARNING}`);
}

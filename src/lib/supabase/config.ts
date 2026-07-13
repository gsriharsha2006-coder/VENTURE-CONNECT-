export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function getSupabasePublicConfig() {
  return {
    url: getSupabaseUrl(),
    publishableKey: getSupabasePublishableKey()
  };
}

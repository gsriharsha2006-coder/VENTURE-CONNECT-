import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { isSupabaseConfigured, isSupabaseServiceConfigured, warnIfSupabaseMissing } from "@/lib/supabase/isConfigured";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    warnIfSupabaseMissing("Supabase service client");
    return null;
  }
  const { url } = getSupabasePublicConfig();
  return createClient(url, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function createServerSupabase() {
  if (!isSupabaseConfigured()) {
    warnIfSupabaseMissing("Supabase server client");
    return null;
  }
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server Component */
        }
      }
    }
  });
}

export async function getAuthUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export { isSupabaseConfigured, isSupabaseServiceConfigured };

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export function getBrowserSupabase() {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return null;
  return createSupabaseBrowserClient();
}

export async function getCurrentUserId() {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export function normalizePlan(plan?: string | null) {
  if (plan === "Student Pro" || plan?.toLowerCase() === "student pro") return "Student Pro";
  if (plan === "Founder Pro" || plan?.toLowerCase() === "founder pro") return "Founder Pro";
  return "Free";
}


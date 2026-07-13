import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

function errorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Unknown Supabase error";
}

export function supabaseDataError(context: string, error: unknown) {
  return new Error(`[Supabase development error] ${context}: ${errorMessage(error)}`);
}

export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") {
    throw supabaseDataError("create browser data client", "A configured browser data service was called during server rendering.");
  }
  return createSupabaseBrowserClient();
}

export async function getCurrentUserId(context = "authenticated data request") {
  if (!isSupabaseConfigured()) return null;
  const supabase = getBrowserSupabase();
  if (!supabase) throw supabaseDataError(context, "Browser client is unavailable.");

  const { data, error } = await supabase.auth.getUser();
  if (error) throw supabaseDataError(context, error);
  if (!data.user) throw supabaseDataError(context, "No authenticated user. Sign in and try again.");
  return data.user.id;
}

export function normalizePlan(plan?: string | null) {
  if (plan === "Student Pro" || ["student pro", "student_pro"].includes(plan?.toLowerCase() ?? "")) return "Student Pro";
  if (plan === "Founder Pro" || ["founder pro", "founder_pro"].includes(plan?.toLowerCase() ?? "")) return "Founder Pro";
  return "Free";
}

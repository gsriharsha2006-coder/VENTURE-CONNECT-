export {
  createBrowserSupabase,
  createSupabaseBrowserClient,
  isSupabaseConfigured,
  authRedirectTo
} from "@/lib/supabase/browser";

import { createBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

/** @deprecated use createBrowserSupabase() */
export const supabase = isSupabaseConfigured() ? createBrowserSupabase() : null;

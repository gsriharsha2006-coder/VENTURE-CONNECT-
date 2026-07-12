import { NextResponse } from "next/server";
import { canAccessMessaging } from "@/lib/subscription/plans";
import { createServiceClient, getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ conversations: [], mode: "mock-fallback" });
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (!canAccessMessaging(profile)) {
    return NextResponse.json({ error: "Messaging requires Student Pro or Founder Pro after reviewer interest", conversations: [] }, { status: 403 });
  }

  const isInvestor = profile.role === "Investor";
  const query = supabase
    .from("conversations")
    .select(`
      *,
      founder:profiles!conversations_founder_id_fkey(id, full_name, email, avatar_url),
      investor:profiles!conversations_investor_id_fkey(id, full_name, email, avatar_url),
      workspace:idea_workspaces!conversations_startup_idea_id_fkey(id, title)
    `)
    .order("updated_at", { ascending: false });

  if (isInvestor) {
    query.eq("investor_id", user.id);
  } else {
    query.eq("founder_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversations: data });
}

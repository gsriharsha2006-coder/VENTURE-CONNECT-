import { NextResponse } from "next/server";
import { createConversationFromInterest } from "@/lib/messaging/service";
import { getAuthUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await request.json() as { action: "interested" | "reject" | "ignore" };

  if (action !== "interested") {
    return NextResponse.json({ status: action });
  }

  try {
    const conversation = await createConversationFromInterest(id, user.id);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { feedPosts } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";

export async function GET() {
  const demoEnabled = isDemoDataEnabled();
  return NextResponse.json({
    data: demoEnabled ? feedPosts : [],
    meta: {
      source: demoEnabled ? "explicit-demo" : "database-required"
    }
  });
}

export async function POST(request: Request) {
  if (!isDemoDataEnabled()) {
    return NextResponse.json({ error: "Feed publishing requires an authenticated backend." }, { status: 503 });
  }
  const body = await request.json();

  return NextResponse.json(
    {
      data: {
        id: `post-${Date.now()}`,
        ...body,
        upvotes: 0,
        comments: 0,
        postedAt: "now"
      }
    },
    { status: 201 }
  );
}

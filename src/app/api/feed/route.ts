import { NextResponse } from "next/server";
import { feedPosts } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    data: feedPosts,
    meta: {
      source: "mock-realtime",
      recommendationModel: "venture-connect-feed-v0"
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json(
    {
      data: {
        id: `post-${Date.now()}`,
        ...body,
        upvotes: 0,
        comments: 0,
        score: 72,
        postedAt: "now"
      }
    },
    { status: 201 }
  );
}

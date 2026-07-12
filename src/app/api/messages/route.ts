import { NextResponse } from "next/server";
import { messageThreads } from "@/lib/data";
import type { UserRole } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    data: messageThreads,
    rules: {
      investorCanInitiate: true,
      founderCanReplyAfterInvestorInterest: true,
      founderCanColdMessageInvestors: false
    }
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    senderRole: UserRole;
    hasInvestorInterest?: boolean;
    message: string;
  };

  const allowed =
    body.senderRole === "Investor" ||
    (body.senderRole === "Founder" && body.hasInvestorInterest === true);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "MESSAGE_NOT_ALLOWED",
        message: "Only investors can initiate conversations. Founders can reply after investor interest."
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      data: {
        id: `message-${Date.now()}`,
        status: "sent",
        message: body.message
      }
    },
    { status: 201 }
  );
}

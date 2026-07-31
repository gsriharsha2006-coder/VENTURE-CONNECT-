import { NextResponse } from "next/server";
import { validationBookings } from "@/lib/data/validations";
import { isDemoDataEnabled } from "@/lib/demo-data";

export async function POST(request: Request) {
  if (!isDemoDataEnabled()) {
    return NextResponse.json({ error: "Validation messaging requires an authenticated backend." }, { status: 503 });
  }
  const body = await request.json() as {
    bookingId?: string;
    senderRole?: "Founder" | "Validator";
    message?: string;
  };

  const booking = validationBookings.find((item) => item.id === body.bookingId);
  if (!booking || !body.message || !body.senderRole) {
    return NextResponse.json({ error: "INVALID_VALIDATION_MESSAGE", message: "Booking, sender role, and message are required." }, { status: 400 });
  }

  if (!booking.accepted && body.senderRole === "Validator") {
    return NextResponse.json({ error: "BOOKING_NOT_ACCEPTED", message: "Validator messaging opens after booking acceptance." }, { status: 403 });
  }

  return NextResponse.json(
    {
      data: {
        id: `validation-message-${Date.now()}`,
        bookingId: booking.id,
        messageType: "text",
        visibility: "booking_participants_only",
        createdAt: new Date().toISOString()
      }
    },
    { status: 201 }
  );
}

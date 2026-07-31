import { NextResponse } from "next/server";
import { validationBookings, validatorReviews } from "@/lib/data/validations";
import { isDemoDataEnabled } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({
    data: validatorReviews.filter((review) => review.verifiedBooking),
    privacy: {
      exposeConfidentialIdeaDetails: false,
      verifiedPaidBookingsOnly: true
    }
  });
}

export async function POST(request: Request) {
  if (!isDemoDataEnabled()) {
    return NextResponse.json({ error: "Validator review submission requires an authenticated backend." }, { status: 503 });
  }
  const body = await request.json() as {
    bookingId?: string;
    rating?: number;
    writtenReview?: string;
  };

  const booking = validationBookings.find((item) => item.id === body.bookingId);
  if (!booking || booking.status !== "Validation Completed") {
    return NextResponse.json({ error: "REVIEW_NOT_ALLOWED", message: "Only completed paid validation bookings can create public validator reviews." }, { status: 403 });
  }

  return NextResponse.json(
    {
      data: {
        id: `validator-review-${Date.now()}`,
        bookingId: booking.id,
        rating: body.rating,
        writtenReview: body.writtenReview,
        verifiedBooking: true,
        confidentialIdeaDetailsRemoved: true
      }
    },
    { status: 201 }
  );
}

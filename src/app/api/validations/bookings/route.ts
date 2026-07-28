import { NextResponse } from "next/server";
import { validationBookings, validators } from "@/lib/data/validations";
import { validationServices } from "@/lib/validation/config";
import type { ValidationServiceType } from "@/lib/validation/types";

export async function GET() {
  return NextResponse.json({
    data: validationBookings,
    rules: {
      documentAccess: "locked_until_validator_acceptance",
      paymentInitialStatus: "pending",
      badgeOnBooking: false
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    validatorId?: string;
    serviceType?: ValidationServiceType;
    workspaceId?: string;
    workspaceVersion?: number;
    quotedPrice?: number;
  };

  const validator = validators.find((item) => item.id === body.validatorId);
  const service = body.serviceType ? validationServices[body.serviceType] : undefined;

  if (!validator || !service || !body.workspaceId || !body.workspaceVersion) {
    return NextResponse.json({ error: "INVALID_VALIDATION_BOOKING", message: "Validator, service, workspace, and version are required." }, { status: 400 });
  }

  if (!validator.serviceTypes.includes(service.type)) {
    return NextResponse.json({ error: "SERVICE_NOT_OFFERED", message: "This validator does not offer the selected validation service." }, { status: 400 });
  }

  if (body.quotedPrice !== undefined && body.quotedPrice !== service.founderPrice) {
    return NextResponse.json({ error: "PRICE_MISMATCH", message: "The booking price must match the configurable validation pricing table." }, { status: 409 });
  }

  return NextResponse.json(
    {
      data: {
        id: `validation-booking-${Date.now()}`,
        validatorId: validator.id,
        serviceType: service.type,
        workspaceId: body.workspaceId,
        workspaceVersion: body.workspaceVersion,
        paymentStatus: "Pending",
        payoutStatus: "Not Eligible",
        documentAccess: "Locked",
        badgeAwarded: false,
        amount: service.founderPrice
      }
    },
    { status: 201 }
  );
}

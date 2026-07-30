import { NextResponse } from "next/server";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { validatorMatchesFilters, validators } from "@/lib/data/validations";
import type { ValidationDomain, ValidationServiceType } from "@/lib/validation/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const domain = (searchParams.get("domain") ?? "All") as "All" | ValidationDomain;
  const serviceType = (searchParams.get("serviceType") ?? "All") as "All" | ValidationServiceType;
  const language = searchParams.get("language") ?? "All";
  const minRating = Number(searchParams.get("minRating") ?? 0);
  const availability = searchParams.get("availability") ?? "All";

  return NextResponse.json({
    data: validators.filter((validator) =>
      validatorMatchesFilters(validator, { query, domain, serviceType, language, minRating, availability })
    ),
    meta: {
      source: isDemoDataEnabled() ? "demo-validation-fixtures" : "database-required",
      publicDirectory: false
    }
  });
}

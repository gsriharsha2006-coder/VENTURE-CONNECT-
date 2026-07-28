import { Badge } from "@/components/ui/Badge";
import type { ValidationBookingStatus } from "@/lib/validation/types";

export function ValidationStatusBadge({ status }: { status: ValidationBookingStatus }) {
  const tone =
    status === "Validation Completed"
      ? "green"
      : status === "Disputed" || status === "Cancelled"
        ? "red"
        : status === "Improvements Required" || status === "Revised Document Submitted"
          ? "amber"
          : "blue";

  return <Badge tone={tone}>{status}</Badge>;
}

"use client";

import { useParams } from "next/navigation";
import { ValidatorPublicProfile } from "@/components/validation/ValidatorPublicProfile";

export default function ValidatorProfilePage() {
  const params = useParams<{ validatorId: string }>();
  return <ValidatorPublicProfile validatorId={params.validatorId} />;
}

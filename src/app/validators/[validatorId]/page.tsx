"use client";

import { useParams } from "next/navigation";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ValidatorPublicProfile } from "@/components/validation/ValidatorPublicProfile";

export default function PublicValidatorProfilePage() {
  const params = useParams<{ validatorId: string }>();

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ValidatorPublicProfile validatorId={params.validatorId} />
      </div>
      <PublicFooter />
    </main>
  );
}

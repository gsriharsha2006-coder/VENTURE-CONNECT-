"use client";

import { ExternalLink, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { validateExternalRegistrationUrl } from "@/lib/opportunities/application-methods";
import type { Opportunity } from "@/lib/types";

export function ExternalRegistrationDialog({
  opportunity,
  onCancel,
  onContinue
}: {
  opportunity: Opportunity;
  onCancel: () => void;
  onContinue: (destination: { url: string; domain: string }) => void;
}) {
  const destination = validateExternalRegistrationUrl(opportunity.external_link);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-registration-title"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">External registration</p>
            <h2 id="external-registration-title" className="mt-2 text-xl font-semibold text-slate-950">
              Continue to Official Registration
            </h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cancel external registration" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          You are leaving Venture Connect and will complete your registration on the organiser&apos;s official website.
        </p>

        {destination.valid ? (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs font-semibold uppercase text-blue-700">Destination</p>
            <p className="mt-1 break-all text-sm font-semibold text-blue-950">{destination.domain}</p>
          </div>
        ) : (
          <div className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <ShieldAlert size={17} className="mt-0.5 shrink-0" />
            {destination.error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!destination.valid}
            onClick={() => {
              if (destination.valid) onContinue(destination);
            }}
          >
            Continue
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

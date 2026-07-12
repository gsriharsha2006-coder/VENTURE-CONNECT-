"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Entitlements } from "@/lib/types";

export function SubscriptionBanner() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((d) => setEntitlements(d.entitlements))
      .catch(() => null);
  }, []);

  if (!entitlements) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="blue">{entitlements.plan}</Badge>
          <p className="mt-2 text-sm text-slate-600">
            Premium reports remaining: <strong>{entitlements.reportsRemaining}</strong>
            {entitlements.freeReportAvailable && " · Free report available"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Messaging: {entitlements.messagingEnabled ? "Active" : "Upgrade required"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/messages" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
            Messages
          </Link>
          {entitlements.plan === "Free" && (
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
              <Crown size={14} />
              Upgrade
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

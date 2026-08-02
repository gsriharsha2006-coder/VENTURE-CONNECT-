"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, MoreHorizontal, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AdEventType, AdPlacement, SponsoredCreative } from "@/lib/ads/types";

async function recordEvent(creative: SponsoredCreative, placement: AdPlacement, eventType: AdEventType) {
  if (creative.isDemo) return { ok: true, demo: true };
  const response = await fetch("/api/ads/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId: creative.campaignId, creativeId: creative.id, placement, eventType })
  });
  if (!response.ok) throw new Error("Promotion preference could not be synced.");
  return { ok: true, demo: false };
}

export function SponsoredCard({ creative, placement, className }: { creative: SponsoredCreative; placement: AdPlacement; className?: string }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState(creative.isDemo ? "Demonstration promotion" : "");
  const [reporting, setReporting] = useState(false);
  const impressionSent = useRef(false);

  useEffect(() => {
    if (impressionSent.current) return;
    impressionSent.current = true;
    void recordEvent(creative, placement, "impression").catch(() => undefined);
  }, [creative, placement]);

  if (hidden) return null;
  const initials = creative.sponsorName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function reportPromotion() {
    setReporting(true);
    setMenuOpen(false);
    try {
      const result = await recordEvent(creative, placement, "report");
      setNotice(result.demo ? "Demo report recorded only in this browser." : "Promotion reported for administrator review.");
    } catch {
      setNotice("The report could not be synced. Please try again.");
    } finally {
      setReporting(false);
    }
  }

  return (
    <article className={cn("relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)} aria-label={`${creative.promotedLabel}: ${creative.headline}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {creative.sponsorLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creative.sponsorLogoUrl} alt="" className="h-10 w-10 rounded-md border border-slate-200 object-contain" />
          ) : (
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">{initials}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{creative.sponsorName}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="slate">{creative.promotedLabel}</Badge>
              {creative.isDemo ? <Badge tone="amber">Demo</Badge> : null}
            </div>
          </div>
        </div>
        <button type="button" aria-label="Promotion options" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <MoreHorizontal aria-hidden="true" size={18} />
        </button>
      </div>

      {menuOpen ? (
        <div className="absolute right-4 top-14 z-10 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button type="button" onClick={() => { setNotice("Shown because this approved campaign targets founder ecosystem interests. Sponsored placement does not affect scores or application visibility."); setMenuOpen(false); }} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50">Why am I seeing this?</button>
          <button type="button" onClick={() => { setHidden(true); void recordEvent(creative, placement, "hide").catch(() => undefined); }} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50">Hide this promotion</button>
          <button type="button" disabled={reporting} onClick={() => void reportPromotion()} className="w-full rounded-md px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60">{reporting ? "Reporting..." : "Report promotion"}</button>
        </div>
      ) : null}

      <h2 className="mt-5 text-base font-semibold text-slate-950">{creative.headline}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{creative.description}</p>
      <a
        href={creative.ctaUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => void recordEvent(creative, placement, "click").catch(() => undefined)}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {creative.ctaLabel}<ExternalLink aria-hidden="true" size={15} />
      </a>
      {notice ? (
        <div role="status" className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <ShieldCheck aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss promotion notice" onClick={() => setNotice("")} className="ml-auto shrink-0"><X aria-hidden="true" size={14} /></button>
        </div>
      ) : null}
    </article>
  );
}

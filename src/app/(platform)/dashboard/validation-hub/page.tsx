"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, ChevronDown, ClipboardCheck, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SkeletonCard, StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { ValidatorCard } from "@/components/validation/ValidatorCard";
import { validationBookings, validatorMatchesFilters, validators } from "@/lib/data/validations";
import { validationDomains, validationServices, validationTrustMetrics } from "@/lib/validation/config";
import type { ValidationDomain, ValidationServiceType } from "@/lib/validation/types";

const serviceOptions: Array<"All" | ValidationServiceType> = ["All", "Written Idea Review", "Live Validation Session", "Expert Validation"];
const priceOptions = ["All", "Under Rs 200", "Rs 200 - Rs 399", "Rs 400+"] as const;
const languageOptions = ["All", "English", "Hindi", "Tamil", "Malayalam", "Kannada", "Marathi"];
const availabilityOptions = ["All", "Today", "Tomorrow", "Jul", "Aug"];

function priceMatches(serviceType: ValidationServiceType, priceRange: (typeof priceOptions)[number]) {
  const price = validationServices[serviceType].founderPrice;
  if (priceRange === "Under Rs 200") return price < 200;
  if (priceRange === "Rs 200 - Rs 399") return price >= 200 && price <= 399;
  if (priceRange === "Rs 400+") return price >= 400;
  return true;
}

export default function ValidationHubPage() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<"All" | ValidationDomain>("All");
  const [serviceType, setServiceType] = useState<"All" | ValidationServiceType>("All");
  const [priceRange, setPriceRange] = useState<(typeof priceOptions)[number]>("All");
  const [language, setLanguage] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [availability, setAvailability] = useState("All");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading] = useState(false);
  const [error] = useState("");

  const filtered = useMemo(
    () =>
      validators.filter((validator) => {
        const matches = validatorMatchesFilters(validator, {
          query,
          domain,
          serviceType,
          language,
          minRating,
          availability
        });
        const priceOk = serviceType === "All"
          ? validator.serviceTypes.some((type) => priceMatches(type, priceRange))
          : priceMatches(serviceType, priceRange);
        return matches && priceOk;
      }),
    [availability, domain, language, minRating, priceRange, query, serviceType]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Validation Hub"
        title="Validate your startup idea with experienced reviewers."
        description="Get structured feedback from verified faculty, incubation teams, founders, and industry professionals before approaching programmes or investors."
        actions={
          <>
            <a href="#validators" className="flex">
              <Button>
                <Search size={16} />
                Find a validator
              </Button>
            </a>
            <a href="#my-validations" className="flex">
              <Button variant="secondary">
                <ClipboardCheck size={16} />
                My validations
              </Button>
            </a>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        {validationTrustMetrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <p className="text-2xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{metric.label}</p>
            <p className="mt-2 text-xs text-slate-400">{metric.note}</p>
          </Card>
        ))}
      </div>

      <Card id="validators">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardHeader eyebrow="Search and filters" title="Find a validator who matches your document" className="mb-1" />
            <p className="text-sm text-slate-500">Use broad filters first. Advanced filters stay collapsed on small screens to keep the page readable.</p>
          </div>
          <Button
            variant="secondary"
            aria-expanded={showAdvanced}
            aria-controls="advanced-validator-filters"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            <SlidersHorizontal size={16} />
            Filters
            <ChevronDown size={16} className={showAdvanced ? "rotate-180 transition" : "transition"} />
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
            <Search size={17} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search by name, institution, or expertise..."
            />
          </label>
          <select aria-label="Validation domain" value={domain} onChange={(event) => setDomain(event.target.value as "All" | ValidationDomain)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>All</option>
            {validationDomains.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Validation service type" value={serviceType} onChange={(event) => setServiceType(event.target.value as "All" | ValidationServiceType)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {serviceOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        {showAdvanced ? (
          <div id="advanced-validator-filters" className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select aria-label="Validation price range" value={priceRange} onChange={(event) => setPriceRange(event.target.value as (typeof priceOptions)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              {priceOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Validator language" value={language} onChange={(event) => setLanguage(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              {languageOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Minimum validator rating" value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <option value={0}>Any rating</option>
              <option value={4.5}>4.5+ rating</option>
              <option value={4.8}>4.8+ rating</option>
            </select>
            <select aria-label="Validator availability" value={availability} onChange={(event) => setAvailability(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              {availabilityOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        ) : null}
      </Card>

      {error ? (
        <StatusMessage tone="error">{error}</StatusMessage>
      ) : null}

      {loading ? (
        <div aria-label="Loading validators" className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => <SkeletonCard key={item} className="h-72" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((validator) => (
              <ValidatorCard key={validator.id} validator={validator} />
            ))}
          </div>

          <aside id="my-validations" className="space-y-4">
            <Card>
              <CardHeader eyebrow="My validations" title="Human review status" />
              <div className="space-y-3">
                {validationBookings.slice(0, 3).map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/validation-hub/workspace/${booking.id}`}
                    className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{booking.workspace.startupName}</p>
                        <p className="mt-1 text-xs text-slate-500">v{booking.workspace.version} / {booking.serviceType}</p>
                      </div>
                      <ValidationStatusBadge status={booking.status} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-600">{booking.nextAction}</p>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader eyebrow="Badge rules" title="No instant validation badges" />
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p className="flex gap-2">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  Payment or booking never creates a badge by itself.
                </p>
                <p className="flex gap-2">
                  <CalendarCheck2 size={16} className="mt-0.5 shrink-0 text-primary" />
                  Validator must complete the report and approve the document version.
                </p>
                <p className="flex gap-2">
                  <ClipboardCheck size={16} className="mt-0.5 shrink-0 text-primary" />
                  If the document changes substantially, Venture Connect shows Revalidation Recommended.
                </p>
              </div>
            </Card>

            <Card>
              <CardHeader eyebrow="Document readiness" title="Validation pipeline" />
              <div className="space-y-4">
                {[
                  ["Select Idea Workspace", 100],
                  ["Book expert review", 100],
                  ["Complete report", 78],
                  ["Request final review", 54]
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
                      <span>{label as string}</span>
                      <span>{value as number}%</span>
                    </div>
                    <ProgressBar value={value as number} />
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      ) : (
        <ValidationEmptyState
          title="No validators match these filters"
          description="Try widening domain, language, rating, or availability. Venture Connect keeps validator discovery focused rather than turning it into a directory."
          action="Reset filters"
          onAction={() => {
            setQuery("");
            setDomain("All");
            setServiceType("All");
            setPriceRange("All");
            setLanguage("All");
            setMinRating(0);
            setAvailability("All");
          }}
        />
      )}
    </div>
  );
}

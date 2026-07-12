"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, FileText, Plus, Send, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { servicePosts, serviceProviders, serviceRequests } from "@/lib/data";
import type { ServiceVerificationStatus } from "@/lib/types";

export default function ProviderPage() {
  const pathname = usePathname();
  const view = pathname === "/provider" ? "dashboard" : pathname.split("/").filter(Boolean).at(-1) ?? "dashboard";
  const provider = serviceProviders[0];
  const [verificationStatus, setVerificationStatus] = useState<ServiceVerificationStatus>(provider.verification_status);
  const [quotation, setQuotation] = useState("Rs 18,000 fixed fee plus official filing charges.");
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const verified = verificationStatus === "Verified";
  const titles: Record<string, [string, string]> = {
    dashboard: ["Provider dashboard", "Track verification, visible services, founder requests, and trust badges."],
    verification: ["Business verification", "Submit identity, business, experience, and category-specific credentials for admin review."],
    services: ["Service listings", "Only verified providers can create founder-visible service posts."],
    requests: ["Founder requests", "Accept, reject, or send quotations for incoming service requests."],
    profile: ["Provider profile", "Maintain founder-facing business, contact, and experience details."]
  };
  const [title, subtitle] = titles[view] ?? titles.dashboard;

  function updateRequest(id: string, status: string) {
    setRequestStatuses((current) => ({ ...current, [id]: status }));
    setNotice(`Request updated to ${status}.`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <Badge>Service Provider</Badge>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
      </Card>

      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div> : null}

      {view === "dashboard" ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <ShieldCheck size={22} className="text-emerald-600" />
              <p className="mt-3 text-sm text-slate-500">Verification status</p>
              <p className="mt-1 text-2xl font-semibold">{verificationStatus}</p>
              <p className="mt-2 text-xs text-slate-500">Verified {provider.verification_date ?? "date pending"}</p>
            </Card>
            <Card>
              <CheckCircle2 size={22} className="text-primary" />
              <p className="mt-3 text-sm text-slate-500">CGPDTM checked</p>
              <p className="mt-1 text-2xl font-semibold">{provider.cgpdtm_checked ? "Yes" : "No"}</p>
              <p className="mt-2 text-xs text-slate-500">{provider.cgpdtm_registration_number ?? "Not provided"}</p>
            </Card>
            <Card>
              <FileText size={22} className="text-primary" />
              <p className="mt-3 text-sm text-slate-500">Founder requests</p>
              <p className="mt-1 text-2xl font-semibold">{serviceRequests.length}</p>
              <p className="mt-2 text-xs text-slate-500">Only verified providers can receive requests.</p>
            </Card>
          </div>
          <Card>
            <CardHeader eyebrow="Trust" title="Verification badges" />
            <div className="flex flex-wrap gap-2">
              {provider.venture_connect_verified ? <Badge tone="green"><ShieldCheck size={13} />Venture Connect Verified</Badge> : null}
              {provider.cgpdtm_checked ? <Badge tone="green">CGPDTM Register Checked</Badge> : null}
              <Badge tone="slate">Verification date: {provider.verification_date ?? "Pending"}</Badge>
            </div>
            <p className="mt-4 text-sm text-slate-600">Verification does not mean government endorsement.</p>
          </Card>
        </>
      ) : null}

      {view === "verification" ? (
        <Card>
          <CardHeader eyebrow="Application" title="Verification details" />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Name", provider.name],
              ["Firm/Company", provider.firm_name],
              ["Email", provider.email],
              ["Phone", provider.phone],
              ["Service category", provider.service_category],
              ["PAN or GST", provider.pan_or_gst],
              ["Website or LinkedIn", provider.website_or_linkedin],
              ["Experience details", provider.experience_details],
              ["CGPDTM registration number", provider.cgpdtm_registration_number ?? ""]
            ].map(([label, value]) => (
              <label key={label} className={label === "Experience details" ? "md:col-span-2" : ""}>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <input defaultValue={value} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
              </label>
            ))}
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">License or certificate</span>
              <input type="file" className="mt-2 block w-full rounded-lg border border-slate-200 p-3 text-sm" />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => {
              setVerificationStatus("Pending");
              setNotice("Verification application submitted for admin review.");
            }}>Submit for verification</Button>
            <Badge tone={verificationStatus === "Verified" ? "green" : "amber"}>{verificationStatus}</Badge>
          </div>
        </Card>
      ) : null}

      {view === "services" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader eyebrow="Listings" title="Visible service posts" />
            {!verified ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Admin verification is required before service posts become visible.
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {servicePosts.filter((post) => post.provider_id === provider.id).map((post) => (
                <div key={post.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Badge>{post.category}</Badge>
                  <p className="mt-3 font-semibold">{post.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{post.description}</p>
                  <p className="mt-3 text-sm font-semibold">Rs {post.original_price.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-xs text-slate-500">{post.contact_info}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Create" title="New service post" />
            <div className="space-y-3">
              {["Service title", "Category", "Original price", "Contact information", "External provider link"].map((label) => (
                <label key={label} className="block">
                  <span className="text-sm font-semibold">{label}</span>
                  <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
                </label>
              ))}
              {["Description", "Guide information"].map((label) => (
                <label key={label} className="block">
                  <span className="text-sm font-semibold">{label}</span>
                  <textarea rows={3} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                </label>
              ))}
              <Button disabled={!verified} className="w-full" onClick={() => setNotice("Service post saved and visible to founders.")}>
                <Plus size={16} />Create service post
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {view === "requests" ? (
        <Card>
          <CardHeader eyebrow="Queue" title="Founder service requests" />
          <div className="space-y-4">
            {serviceRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">Request {request.id}</p>
                  <Badge>{requestStatuses[request.id] ?? request.status}</Badge>
                </div>
                <textarea value={quotation} onChange={(event) => setQuotation(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => updateRequest(request.id, "Accepted")}><CheckCircle2 size={14} />Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateRequest(request.id, "Rejected")}><XCircle size={14} />Reject</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateRequest(request.id, "Quotation Sent")}><Send size={14} />Send quote</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {view === "profile" ? (
        <Card>
          <CardHeader eyebrow="Founder-facing" title={provider.firm_name} />
          <div className="grid gap-4 md:grid-cols-2">
            {[["Name", provider.name], ["Firm", provider.firm_name], ["Email", provider.email], ["Phone", provider.phone], ["Website", provider.website_or_linkedin], ["Category", provider.service_category]].map(([label, value]) => (
              <label key={label}>
                <span className="text-sm font-semibold">{label}</span>
                <input defaultValue={value} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
              </label>
            ))}
          </div>
          <Button className="mt-5" onClick={() => setNotice("Provider profile saved.")}>Save profile</Button>
        </Card>
      ) : null}
    </div>
  );
}

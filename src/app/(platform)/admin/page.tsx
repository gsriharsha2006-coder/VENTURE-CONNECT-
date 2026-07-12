"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Ban, CheckCircle2, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { adminStats, applications, opportunities, reportSuite, serviceProviders } from "@/lib/data";
import type { ServiceVerificationStatus, SubscriptionPlan } from "@/lib/types";

const seedUsers = [
  { id: "user-1", name: "Nisha Rao", role: "Founder", plan: "Free" as SubscriptionPlan, verification: "Verified", trust: 82 },
  { id: "user-2", name: "Maya Srinivasan", role: "Investor", plan: "Founder Pro" as SubscriptionPlan, verification: "Verified", trust: 94 },
  { id: "user-3", name: "Ritika Menon", role: "Service Provider", plan: "Student Pro" as SubscriptionPlan, verification: "Pending", trust: 73 }
];

export default function AdminPage() {
  const pathname = usePathname();
  const view = pathname === "/admin" ? "overview" : pathname.split("/").filter(Boolean).at(-1) ?? "overview";
  const [users, setUsers] = useState(seedUsers);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ServiceVerificationStatus>>({});
  const [opportunityStatuses, setOpportunityStatuses] = useState<Record<string, "Approved" | "Rejected">>({});
  const [notice, setNotice] = useState("");

  function setProviderStatus(id: string, status: ServiceVerificationStatus) {
    setProviderStatuses((current) => ({ ...current, [id]: status }));
    setNotice(`Provider status updated to ${status}.`);
  }

  function setPlan(userId: string, plan: SubscriptionPlan) {
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, plan } : user));
    setNotice(`Subscription updated to ${plan} for testing.`);
  }

  const headings: Record<string, [string, string]> = {
    overview: ["Trust, verification, usage, and plan management", "Monitor the MVP workflow and open a focused admin queue from the sidebar."],
    users: ["User management", "Verify, suspend, and review founders, investors, organizers, and service providers."],
    opportunities: ["Opportunity moderation", "Approve or reject reviewer-created opportunity posts before founder discovery."],
    providers: ["Provider verification", "Review credentials and apply Venture Connect and CGPDTM trust markers."],
    reports: ["VC Readiness usage", "Track report type, required plan, application state, and mock fallback readiness."],
    subscriptions: ["Subscription controls", "Review usage and manually change plans for MVP testing."]
  };
  const [title, subtitle] = headings[view] ?? headings.overview;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Badge>Admin</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      </motion.div>

      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div> : null}

      {view === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {adminStats.map((stat) => <MetricCard key={stat.label} {...stat} />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader eyebrow="Applications" title="Status check" />
              <div className="space-y-3">
                {applications.map((application) => (
                  <p key={application.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{application.startup} / {application.status}</p>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader eyebrow="Reports" title="AI usage" />
              <p className="text-4xl font-semibold">{reportSuite.length}</p>
              <p className="mt-2 text-sm text-slate-600">Report types configured with local fallback generation.</p>
            </Card>
            <Card>
              <CardHeader eyebrow="Providers" title="Verification queue" />
              <p className="text-4xl font-semibold">{serviceProviders.filter((provider) => provider.verification_status === "Pending").length}</p>
              <p className="mt-2 text-sm text-slate-600">Providers awaiting a manual trust review.</p>
            </Card>
          </div>
        </>
      ) : null}

      {view === "users" ? (
        <Card>
          <CardHeader eyebrow="Users" title="Accounts and trust" />
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.role} / {user.plan} / Trust {user.trust}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setNotice(`${user.name} verified.`)}><UserCheck size={14} />Verify</Button>
                    <Button size="sm" variant="secondary" onClick={() => setNotice(`${user.name} suspended.`)}><Ban size={14} />Suspend</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {view === "opportunities" ? (
        <Card>
          <CardHeader eyebrow="Moderation" title="Opportunity posts" />
          <div className="space-y-3">
            {opportunities.map((opportunity) => {
              const status = opportunityStatuses[opportunity.id];
              return (
                <div key={opportunity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{opportunity.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{opportunity.organizer_name} / {opportunity.opportunity_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {status ? <Badge tone={status === "Approved" ? "green" : "amber"}>{status}</Badge> : null}
                      <Button size="sm" onClick={() => setOpportunityStatuses((current) => ({ ...current, [opportunity.id]: "Approved" }))}><CheckCircle2 size={14} />Approve</Button>
                      <Button size="sm" variant="secondary" onClick={() => setOpportunityStatuses((current) => ({ ...current, [opportunity.id]: "Rejected" }))}><XCircle size={14} />Reject</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {view === "providers" ? (
        <Card>
          <CardHeader eyebrow="Service Providers" title="Credential review" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Provider</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">CGPDTM</th>
                  <th className="py-3 pr-4">Verification date</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceProviders.map((provider) => {
                  const status = providerStatuses[provider.id] ?? provider.verification_status;
                  return (
                    <tr key={provider.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold">{provider.firm_name}</td>
                      <td className="py-3 pr-4">{provider.service_category}</td>
                      <td className="py-3 pr-4"><Badge tone={status === "Verified" ? "green" : "amber"}>{status}</Badge></td>
                      <td className="py-3 pr-4">{provider.cgpdtm_checked ? "Register checked" : "Pending"}</td>
                      <td className="py-3 pr-4">{status === "Verified" ? provider.verification_date ?? new Date().toLocaleDateString("en-IN") : "Not set"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setProviderStatus(provider.id, "Verified")}><ShieldCheck size={14} />Verify</Button>
                          <Button size="sm" variant="secondary" onClick={() => setProviderStatus(provider.id, "Rejected")}>Reject</Button>
                          <Button size="sm" variant="secondary" onClick={() => setProviderStatus(provider.id, "Suspended")}>Suspend</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">Verification does not mean government endorsement.</p>
        </Card>
      ) : null}

      {view === "reports" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportSuite.map((report) => (
            <Card key={report.id}>
              <Badge>{report.plan}</Badge>
              <h2 className="mt-3 font-semibold">{report.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{report.subtitle}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>Latest score</span><strong>{report.score}/100</strong>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {view === "subscriptions" ? (
        <Card>
          <CardHeader eyebrow="Plans" title="Manual MVP controls" />
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_220px_auto] md:items-center">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.role} / current plan: {user.plan}</p>
                </div>
                <select value={user.plan} onChange={(event) => setPlan(user.id, event.target.value as SubscriptionPlan)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  <option>Free</option><option>Student Pro</option><option>Founder Pro</option>
                </select>
                <Badge tone="blue">Usage tracked</Badge>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["Free SWOT one-time usage", "Monthly premium report count", "Monthly opportunity submissions"].map((item) => (
              <p key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{item}</p>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

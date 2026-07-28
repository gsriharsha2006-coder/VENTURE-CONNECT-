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
import { validationBadges, validationBookings, validationReports, validators } from "@/lib/data/validations";
import type { ServiceVerificationStatus, SubscriptionPlan } from "@/lib/types";
import { validationServices, validatorLevelRules } from "@/lib/validation/config";
import type { ValidatorLevel } from "@/lib/validation/types";

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
  const [validatorStatuses, setValidatorStatuses] = useState<Record<string, "Approved" | "Rejected" | "Suspended">>({});
  const [validatorLimits, setValidatorLimits] = useState<Record<string, ValidatorLevel>>({});
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
    validators: ["Validator applications and credential review", "Approve, reject, suspend, and configure weekly limits for human validators."],
    bookings: ["Validation bookings", "Review booked validations, document access state, acceptance, completion, and dispute risk."],
    reports: ["Reports and flagged review quality", "Track VC readiness reports plus structured human validation reports and badge recommendations."],
    payments: ["Payments and payouts", "Monitor escrow payments, commission configuration, and validator payout release conditions."],
    disputes: ["Disputes and flagged reports", "Review founder disputes, late reports, quality concerns, and confidential-access issues."],
    settings: ["Validation settings", "Configure commission, validator limits, pricing ranges, badge rules, and review requirements."],
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
            <Card>
              <CardHeader eyebrow="Validation Hub" title="Human review controls" />
              <p className="text-4xl font-semibold">{validationBookings.length}</p>
              <p className="mt-2 text-sm text-slate-600">Bookings with report, badge, payout, and dispute gates.</p>
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

      {view === "validators" ? (
        <Card>
          <CardHeader eyebrow="Validators" title="Credential review and limits" />
          <div className="space-y-3">
            {validators.map((validator) => {
              const status = validatorStatuses[validator.id] ?? "Approved";
              const level = validatorLimits[validator.id] ?? validator.level;
              return (
                <div key={validator.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{validator.name}</p>
                        <Badge tone={status === "Approved" ? "green" : status === "Suspended" ? "red" : "amber"}>{status}</Badge>
                        <Badge tone="slate">{level}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{validator.role} / {validator.institution} / {validator.completedValidations} completed</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={level}
                        onChange={(event) => {
                          setValidatorLimits((current) => ({ ...current, [validator.id]: event.target.value as ValidatorLevel }));
                          setNotice(`Weekly limits updated for ${validator.name}.`);
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      >
                        {Object.keys(validatorLevelRules).map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <Button size="sm" onClick={() => setValidatorStatuses((current) => ({ ...current, [validator.id]: "Approved" }))}><CheckCircle2 size={14} />Approve</Button>
                      <Button size="sm" variant="secondary" onClick={() => setValidatorStatuses((current) => ({ ...current, [validator.id]: "Rejected" }))}>Reject</Button>
                      <Button size="sm" variant="secondary" onClick={() => setValidatorStatuses((current) => ({ ...current, [validator.id]: "Suspended" }))}>Suspend</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-slate-600 md:grid-cols-3">
                    <p className="rounded-lg border border-slate-200 bg-white p-3">Weekly limit: {validatorLevelRules[level].weeklyLimit}</p>
                    <p className="rounded-lg border border-slate-200 bg-white p-3">{validatorLevelRules[level].pricingRange}</p>
                    <p className="rounded-lg border border-slate-200 bg-white p-3">Only admins can approve validators.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {view === "bookings" ? (
        <Card>
          <CardHeader eyebrow="Bookings" title="Validation booking oversight" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Founder</th>
                  <th className="py-3 pr-4">Validator</th>
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">Document</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Access</th>
                </tr>
              </thead>
              <tbody>
                {validationBookings.map((booking) => {
                  const validator = validators.find((item) => item.id === booking.validatorId);
                  return (
                    <tr key={booking.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold">{booking.workspace.startupName}</td>
                      <td className="py-3 pr-4">{booking.founderName}</td>
                      <td className="py-3 pr-4">{validator?.name}</td>
                      <td className="py-3 pr-4">{booking.serviceType}</td>
                      <td className="py-3 pr-4">v{booking.workspace.version} / {booking.workspace.completionPercentage}%</td>
                      <td className="py-3 pr-4"><Badge>{booking.status}</Badge></td>
                      <td className="py-3 pr-4">{booking.accepted ? "Unlocked after acceptance" : "Locked"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {view === "reports" ? (
        <div className="space-y-4">
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
          <Card>
            <CardHeader eyebrow="Human validation reports" title="Badge and quality review" />
            <div className="space-y-3">
              {validationReports.map((report) => (
                <div key={report.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{report.serviceType} / {report.readinessStage}</p>
                      <p className="mt-1 text-xs text-slate-500">Booking {report.bookingId} / v{report.ideaWorkspaceVersion}</p>
                    </div>
                    <Badge tone={report.approvedForBadge ? "green" : "amber"}>{report.approvedForBadge ? "Badge approved" : "Needs review"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {view === "payments" ? (
        <Card>
          <CardHeader eyebrow="Payments" title="Escrow, commissions, and payouts" />
          <div className="grid gap-3 md:grid-cols-3">
            {Object.values(validationServices).map((service) => (
              <div key={service.type} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Badge>{service.type}</Badge>
                <p className="mt-3 text-sm">Founder pays: <strong>Rs {service.founderPrice}</strong></p>
                <p className="mt-1 text-sm">Validator receives: <strong>Rs {service.validatorPayout}</strong></p>
                <p className="mt-1 text-sm">Venture Connect earns: <strong>Rs {service.platformShare}</strong></p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["Required report submitted", "Session completed when applicable", "Founder dispute window ended"].map((item) => (
              <p key={item} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{item}</p>
            ))}
          </div>
        </Card>
      ) : null}

      {view === "disputes" ? (
        <Card>
          <CardHeader eyebrow="Disputes" title="Quality and confidentiality review" />
          <div className="space-y-3">
            {[
              ["validation-booking-2", "Late report risk", "Session scheduled but report not yet started."],
              ["validation-booking-4", "Document access pending", "Validator has not accepted, so full document is still locked."],
              ["validation-report-1", "Badge audit", "Verify report sections before public badge summary remains visible."]
            ].map(([id, label, body]) => (
              <div key={id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="mt-1 text-sm text-slate-600">{body}</p>
                  </div>
                  <Button size="sm" variant="secondary">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {view === "settings" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Commission" title="Configurable pricing rules" />
            <div className="space-y-3">
              {Object.values(validationServices).map((service) => (
                <div key={service.type} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
                  <label>
                    <span className="text-xs text-slate-500">Founder price</span>
                    <input value={service.founderPrice} readOnly className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2" />
                  </label>
                  <label>
                    <span className="text-xs text-slate-500">Validator payout</span>
                    <input value={service.validatorPayout} readOnly className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2" />
                  </label>
                  <label>
                    <span className="text-xs text-slate-500">Platform share</span>
                    <input value={service.platformShare} readOnly className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2" />
                  </label>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Badge rules" title="Public summary safeguards" />
            <div className="space-y-3">
              {[
                "No badge after payment or booking only.",
                "Report must approve the exact Idea Workspace version.",
                "Limited investor summary never exposes the full confidential report by default.",
                "Major document changes show Revalidation Recommended."
              ].map((rule) => (
                <p key={rule} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{rule}</p>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {validationBadges.map((badge) => <Badge key={badge.id} tone="green">{badge.name}</Badge>)}
            </div>
          </Card>
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

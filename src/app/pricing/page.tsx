import Link from "next/link";
import { Crown } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Badge } from "@/components/ui/Badge";
import { PricingCheckout } from "@/components/subscription/PricingCheckout";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between">
          <VentureLogo />
          <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-panel">
            Open platform
          </Link>
        </header>

        <section className="py-16 text-center">
          <Badge>
            <Crown size={13} />
            Subscription plans
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-semibold tracking-normal text-slate-950">
            Plans for documents, submissions, reports, and gated messaging
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Free keeps founders focused on one Startup Template and one Basic SWOT Report. Student Pro and Founder Pro unlock all templates, premium reports, DOCX export, and messaging after investor interest.
          </p>
        </section>

        <PricingCheckout />

        <section className="mt-12 overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-4 bg-slate-50 text-sm font-semibold text-slate-600">
            <div className="p-4">Capability</div>
            <div className="p-4 text-center">Free</div>
            <div className="p-4 text-center">Student Pro</div>
            <div className="p-4 text-center">Founder Pro</div>
          </div>
          {[
            ["Idea Workspaces", "1", "Unlimited", "Unlimited"],
            ["Templates", "Startup only", "All templates", "All templates"],
            ["Opportunity submissions", "1/month", "10/month", "30/month"],
            ["VC Readiness Reports", "1 Basic SWOT once", "3 premium/month", "5 premium/month"],
            ["Exports", "PDF", "PDF + DOCX", "PDF + DOCX"],
            ["Messaging", "Interest preview only", "Full chat after interest", "Full chat after interest"],
            ["Advanced reports", "No", "No Roadmap/Scorecard", "Roadmap + Investor Scorecard"]
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-4 border-t border-slate-200 text-sm text-slate-700">
              {row.map((cell, index) => (
                <div key={`${row[0]}-${index}`} className={`p-4 ${index === 0 ? "font-semibold text-slate-950" : "text-center"}`}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight, Check, Minus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PricingCheckout } from "@/components/subscription/PricingCheckout";

const comparison = [
  ["Idea Workspaces", "1", "Unlimited", "Unlimited"],
  ["Document templates", "Startup template", "All templates", "All templates"],
  ["Opportunity submissions", "1/month", "10/month", "30/month"],
  ["VC Readiness Reports", "1 Basic SWOT", "3 premium/month", "5 premium/month"],
  ["Exports", "PDF", "PDF + DOCX", "PDF + DOCX"],
  ["Messaging after interest", false, true, true],
  ["Advanced roadmap and scorecard", false, false, true]
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8">
          <Badge>
            <ShieldCheck aria-hidden="true" size={13} />
            Simple founder plans
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Pay for more workflow capacity, not access to people.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Start with one structured workspace. Upgrade for more documents, applications, reports, exports, and messaging after verified interest.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <PricingCheckout />

        <div className="mt-12 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Venture Connect plan comparison</caption>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="p-4 font-semibold">Capability</th>
                <th scope="col" className="p-4 text-center font-semibold">Free</th>
                <th scope="col" className="p-4 text-center font-semibold">Student Pro</th>
                <th scope="col" className="p-4 text-center font-semibold">Founder Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row[0]} className="border-t border-slate-200">
                  <th scope="row" className="p-4 font-semibold text-slate-950">{row[0]}</th>
                  {row.slice(1).map((value, index) => (
                    <td key={`${row[0]}-${index}`} className="p-4 text-center text-slate-600">
                      {typeof value === "boolean" ? (
                        value
                          ? <Check aria-label="Included" size={18} className="mx-auto text-emerald-600" />
                          : <Minus aria-label="Not included" size={18} className="mx-auto text-slate-300" />
                      ) : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex flex-col items-center border-t border-slate-200 pt-10 text-center">
          <h2 className="text-2xl font-semibold">Not sure which plan fits?</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Create the free workspace first. Venture Connect will show plan limits before any paid action.
          </p>
          <Link href="/auth/register" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Create a free founder account
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Badge } from "@/components/ui/Badge";

const faqs = [
  ["Is Venture Connect a social network?", "No. It is a VC Readiness Workflow Platform focused on structured documents, readiness reports, applications, and interest-gated messaging."],
  ["Can founders message investors first?", "No. Messaging unlocks only after an investor or incubator marks an application Interested."],
  ["Do events require an Idea Workspace document?", "No. Events can allow direct application after the founder reads the event guidelines."],
  ["What does AI do?", "AI generates VC Readiness Reports from a selected Idea Workspace document. It does not provide live hints or act as a chat assistant."],
  ["How are service providers verified?", "Admins review documents, approve or reject providers, can suspend providers, and can mark CGPDTM registration checked for patent providers."],
  ["What happens on the Free plan?", "Free founders get one Startup Template document, one submission per month, one lifetime Basic SWOT Report, PDF export, and interest preview without full chat access."]
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <VentureLogo />
          <Link href="/auth" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Open platform</Link>
        </header>

        <section className="py-16">
          <Badge>
            <HelpCircle size={13} />
            FAQ
          </Badge>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-normal">Venture Connect rules and platform basics</h1>
        </section>

        <div className="space-y-4 pb-16">
          {faqs.map(([question, answer]) => (
            <section key={question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{question}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

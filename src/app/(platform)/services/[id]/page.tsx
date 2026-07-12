import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { servicePosts, serviceProviders } from "@/lib/data";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = servicePosts.find((item) => item.id === id);
  if (!post) notFound();
  const provider = serviceProviders.find((item) => item.id === post.provider_id);
  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/services" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft size={16} />
        Back to services
      </Link>

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{post.category}</Badge>
              <Badge tone="green">
                <ShieldCheck size={13} />
                {provider.verification_status}
              </Badge>
              {provider.cgpdtm_checked ? <Badge tone="green">CGPDTM Register Checked</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold">{post.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{post.description}</p>
          </div>
          <a href={post.external_link} target="_blank" rel="noreferrer">
            <Button>
              Go to provider
              <ExternalLink size={16} />
            </Button>
          </a>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Guide" title="Service guide information" />
            <p className="text-sm leading-7 text-slate-600">{post.guide_info}</p>
          </Card>
          <Card>
            <CardHeader eyebrow="Provider" title={provider.firm_name} />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Name", provider.name],
                ["Email", provider.email],
                ["Phone", provider.phone],
                ["Website/LinkedIn", provider.website_or_linkedin],
                ["Verification date", provider.verification_date ?? "Pending"],
                ["PAN/GST", provider.pan_or_gst]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-sm text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Pricing" title={`Rs ${post.original_price.toLocaleString("en-IN")}`} />
            <p className="text-sm leading-6 text-slate-600">
              Paid founders see the actual provider price. Free founders see this price plus a Rs 2,000 Venture Connect platform service fee in the marketplace.
            </p>
          </Card>
          <Card>
            <CardHeader eyebrow="Disclaimer" title="Verification note" />
            <p className="text-sm leading-6 text-slate-600">Verification does not mean government endorsement.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

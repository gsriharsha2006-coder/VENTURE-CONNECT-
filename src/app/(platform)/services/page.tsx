"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, ShieldCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { servicePosts as seedServicePosts, serviceProviders as seedServiceProviders } from "@/lib/data";
import { getServicePosts } from "@/lib/data/services";
import type { ServiceCategory, SubscriptionPlan } from "@/lib/types";

const categories: Array<"All" | ServiceCategory> = [
  "All",
  "Patent filing",
  "Trademark registration",
  "Company registration",
  "GST/tax filing",
  "ROC compliance",
  "Legal documentation",
  "Pitch deck design",
  "Financial modeling",
  "Startup compliance",
  "Product development",
  "Marketing services"
];

function priceForPlan(price: number, plan: SubscriptionPlan) {
  return plan === "Free" ? price + 2000 : price;
}

export default function ServicesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [plan, setPlan] = useState<SubscriptionPlan>("Free");
  const [servicePosts, setServicePosts] = useState(seedServicePosts);
  const [serviceProviders, setServiceProviders] = useState(seedServiceProviders);

  useEffect(() => {
    let mounted = true;
    void getServicePosts().then(({ posts, providers }) => {
      if (!mounted) return;
      setServicePosts(posts);
      setServiceProviders(providers);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const verifiedPosts = useMemo(
    () =>
      servicePosts.filter((post) => {
        const provider = serviceProviders.find((item) => item.id === post.provider_id);
        const matchesQuery = `${post.title} ${post.category} ${post.description}`.toLowerCase().includes(query.toLowerCase());
        return provider?.verification_status === "Verified" && matchesQuery && (category === "All" || post.category === category);
      }),
    [category, query, servicePosts, serviceProviders]
  );

  return (
    <div className="space-y-6">
      <Card>
        <Badge>
          <Store size={13} />
          Services
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold">Verified startup service providers</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Discover verified providers for patent, legal, compliance, deck, finance, product, and marketing needs. Only admin-verified providers can receive founder requests.
        </p>
      </Card>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_180px]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Search size={17} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search services..." />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof categories)[number])} className="h-11 rounded-lg border border-slate-200 px-3 text-sm">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm">
            <option>Free</option>
            <option>Student Pro</option>
            <option>Founder Pro</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {verifiedPosts.map((post) => {
          const provider = serviceProviders.find((item) => item.id === post.provider_id)!;
          const shownPrice = priceForPlan(post.original_price, plan);
          return (
            <Card key={post.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge>{post.category}</Badge>
                  <h2 className="mt-3 text-lg font-semibold">{post.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{provider.firm_name}</p>
                </div>
                <Badge tone="green">
                  <ShieldCheck size={13} />
                  Venture Connect Verified
                </Badge>
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{post.description}</p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Price for {plan}</p>
                <p className="mt-1 text-2xl font-semibold">Rs {shownPrice.toLocaleString("en-IN")}</p>
                {plan === "Free" ? <p className="mt-1 text-xs text-amber-700">Includes Rs 2,000 platform service fee.</p> : <p className="mt-1 text-xs text-emerald-700">Paid plan shows actual provider price.</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {provider.cgpdtm_checked ? <Badge tone="green">CGPDTM Register Checked</Badge> : null}
                <Badge tone="slate">Verified {provider.verification_date}</Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Verification does not mean government endorsement.</p>
              <div className="mt-5 flex gap-2">
                <Link href={`/dashboard/services/${post.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">Details</Button>
                </Link>
                <a href={post.external_link} target="_blank" rel="noreferrer">
                  <Button>
                    <ExternalLink size={16} />
                  </Button>
                </a>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader eyebrow="Trust" title="Provider verification rules" />
        <div className="grid gap-3 md:grid-cols-3">
          {["Pending providers cannot receive founder requests.", "Patent providers can show CGPDTM Register Checked after manual admin verification.", "Admin can reject, verify, or suspend low-quality providers."].map((item) => (
            <p key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}

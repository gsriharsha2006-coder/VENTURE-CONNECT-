import { servicePosts as mockServicePosts, serviceProviders as mockServiceProviders, serviceRequests as mockServiceRequests } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId } from "@/lib/data/shared";
import type { ServiceCategory, ServicePost, ServiceProvider, ServiceRequest } from "@/lib/types";

function normalizeProviderStatus(status?: string | null): ServiceProvider["verification_status"] {
  if (status === "Verified" || status?.toLowerCase() === "verified") return "Verified";
  if (status === "Rejected" || status?.toLowerCase() === "rejected") return "Rejected";
  if (status === "Suspended" || status?.toLowerCase() === "suspended") return "Suspended";
  return "Pending";
}

function providerFromRow(row: {
  id: string;
  user_id: string | null;
  name: string | null;
  firm_name: string | null;
  email: string | null;
  phone: string | null;
  service_category: string | null;
  pan_or_gst: string | null;
  website_or_linkedin: string | null;
  experience_details: string | null;
  certificate_url: string | null;
  cgpdtm_registration_number: string | null;
  verification_status: string | null;
  venture_connect_verified: boolean | null;
  cgpdtm_checked: boolean | null;
  verification_date: string | null;
  created_at: string | null;
}): ServiceProvider {
  return {
    id: row.id,
    user_id: row.user_id ?? "",
    name: row.name ?? "Provider",
    firm_name: row.firm_name ?? "Provider firm",
    email: row.email ?? "",
    phone: row.phone ?? "",
    service_category: (row.service_category as ServiceCategory) ?? "Startup compliance",
    pan_or_gst: row.pan_or_gst ?? "",
    website_or_linkedin: row.website_or_linkedin ?? "",
    experience_details: row.experience_details ?? "",
    certificate_url: row.certificate_url ?? undefined,
    cgpdtm_registration_number: row.cgpdtm_registration_number ?? undefined,
    verification_status: normalizeProviderStatus(row.verification_status),
    venture_connect_verified: row.venture_connect_verified ?? false,
    cgpdtm_checked: row.cgpdtm_checked ?? false,
    verification_date: row.verification_date ?? undefined,
    created_at: row.created_at ?? new Date().toISOString()
  };
}

function postFromRow(row: {
  id: string;
  provider_id: string | null;
  title: string | null;
  category: string | null;
  description: string | null;
  guide_info: string | null;
  original_price: number | null;
  listed_price: number | null;
  contact_info: string | null;
  external_link: string | null;
  created_at: string | null;
}): ServicePost {
  return {
    id: row.id,
    provider_id: row.provider_id ?? "",
    title: row.title ?? "Startup service",
    category: (row.category as ServiceCategory) ?? "Startup compliance",
    description: row.description ?? "",
    guide_info: row.guide_info ?? "",
    original_price: row.original_price ?? row.listed_price ?? 0,
    listed_price: row.listed_price ?? row.original_price ?? 0,
    contact_info: row.contact_info ?? "",
    external_link: row.external_link ?? "#",
    created_at: row.created_at ?? new Date().toISOString()
  };
}

export async function getServicePosts(): Promise<{ posts: ServicePost[]; providers: ServiceProvider[] }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { posts: mockServicePosts, providers: mockServiceProviders };

  const [{ data: providers, error: providerError }, { data: posts, error: postError }] = await Promise.all([
    supabase.from("service_providers").select("*"),
    supabase.from("service_posts").select("*").order("created_at", { ascending: false })
  ]);

  if (providerError || postError || !providers?.length || !posts?.length) {
    return { posts: mockServicePosts, providers: mockServiceProviders };
  }

  return {
    posts: posts.map(postFromRow),
    providers: providers.map(providerFromRow)
  };
}

export async function createServiceProviderProfile(input: Partial<ServiceProvider>) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return { mode: "mock-fallback" as const, provider: input };

  const { data, error } = await supabase
    .from("service_providers")
    .insert({
      user_id: userId,
      name: input.name ?? "",
      firm_name: input.firm_name ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      service_category: input.service_category ?? "Startup compliance",
      pan_or_gst: input.pan_or_gst ?? "",
      website_or_linkedin: input.website_or_linkedin ?? "",
      experience_details: input.experience_details ?? "",
      certificate_url: input.certificate_url ?? null,
      cgpdtm_registration_number: input.cgpdtm_registration_number ?? null
    })
    .select()
    .single();

  if (error || !data) return { mode: "mock-fallback" as const, provider: input };
  return providerFromRow(data);
}

export async function createServicePost(input: Partial<ServicePost>) {
  const supabase = getBrowserSupabase();
  if (!supabase || !input.provider_id) return { mode: "mock-fallback" as const, post: input };

  const { data, error } = await supabase
    .from("service_posts")
    .insert({
      provider_id: input.provider_id,
      title: input.title ?? "Startup service",
      category: input.category ?? "Startup compliance",
      description: input.description ?? "",
      guide_info: input.guide_info ?? "",
      original_price: input.original_price ?? input.listed_price ?? 0,
      listed_price: input.listed_price ?? input.original_price ?? 0,
      contact_info: input.contact_info ?? "",
      external_link: input.external_link ?? ""
    })
    .select()
    .single();

  if (error || !data) return { mode: "mock-fallback" as const, post: input };
  return postFromRow(data);
}

export async function createServiceRequest(input: Pick<ServiceRequest, "provider_id" | "service_post_id"> & { quotation?: string }) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) {
    return {
      ...mockServiceRequests[0],
      id: `request-${Date.now()}`,
      founder_id: userId ?? "prototype-founder",
      provider_id: input.provider_id,
      service_post_id: input.service_post_id
    };
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      founder_id: userId,
      provider_id: input.provider_id,
      service_post_id: input.service_post_id,
      quotation: input.quotation ?? null
    })
    .select()
    .single();

  if (error || !data) {
    return {
      ...mockServiceRequests[0],
      id: `request-${Date.now()}`,
      founder_id: userId,
      provider_id: input.provider_id,
      service_post_id: input.service_post_id
    };
  }

  return data;
}


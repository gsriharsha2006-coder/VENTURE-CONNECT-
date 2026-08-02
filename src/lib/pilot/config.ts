export const PILOT_OPPORTUNITY_TYPES = ["Incubator program", "Hackathon"] as const;
export const PILOT_REPORT_TYPE = "Basic SWOT Report" as const;

export const PILOT_FLAGS = {
  investors: process.env.PILOT_INVESTORS_ENABLED === "true",
  ads: process.env.PILOT_ADS_ENABLED === "true",
  events: process.env.PILOT_EVENTS_ENABLED === "true",
  multipleTemplates: process.env.PILOT_MULTIPLE_TEMPLATES_ENABLED === "true"
} as const;

const disabledPagePrefixes = [
  "/ai-coach",
  "/applications",
  "/billing",
  "/blogs",
  "/feed",
  "/investor",
  "/investor-dashboard",
  "/pricing",
  "/provider",
  "/search",
  "/services",
  "/validator",
  "/validators",
  "/dashboard/billing",
  "/dashboard/services",
  "/dashboard/validation-hub",
  "/admin/bookings",
  "/admin/disputes",
  "/admin/payments",
  "/admin/providers",
  "/admin/sponsorship",
  "/admin/subscriptions",
  "/admin/validators"
] as const;

const disabledApiPrefixes = [
  "/api/admin/sponsorship",
  "/api/ads",
  "/api/ai/report",
  "/api/feed",
  "/api/pitches",
  "/api/startups",
  "/api/subscription",
  "/api/subscriptions",
  "/api/validations",
  "/api/webhooks/razorpay"
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPilotPageDisabled(pathname: string) {
  if (PILOT_FLAGS.investors && (matchesPrefix(pathname, "/investor") || matchesPrefix(pathname, "/investor-dashboard"))) return false;
  if (PILOT_FLAGS.ads && matchesPrefix(pathname, "/admin/sponsorship")) return false;
  if (PILOT_FLAGS.events && matchesPrefix(pathname, "/events")) return false;
  if (disabledPagePrefixes.some((prefix) => matchesPrefix(pathname, prefix))) return true;
  return false;
}

export function isPilotApiDisabled(pathname: string) {
  if (PILOT_FLAGS.ads && (matchesPrefix(pathname, "/api/ads") || matchesPrefix(pathname, "/api/admin/sponsorship"))) return false;
  if (disabledApiPrefixes.some((prefix) => matchesPrefix(pathname, prefix))) return true;
  return /\/api\/conversations\/[^/]+\/(meetings|upload)$/.test(pathname);
}

export function isPilotOpportunityType(value: string | null | undefined) {
  return PILOT_OPPORTUNITY_TYPES.includes(value as (typeof PILOT_OPPORTUNITY_TYPES)[number]);
}

import type { ApplicationMethod, Opportunity, OpportunityType } from "@/lib/types";

export const APPLICATION_METHOD_LABELS: Record<ApplicationMethod, string> = {
  external_registration: "External Registration",
  idea_workspace_application: "Apply with Idea Workspace",
  hybrid_application: "Hybrid Application",
  information_only: "Information Only"
};

export const OPPORTUNITY_TYPE_OPTIONS: OpportunityType[] = [
  "Hackathon",
  "Investor opportunity",
  "Incubator program",
  "Accelerator program",
  "Startup competition",
  "Workshop",
  "Webinar",
  "Networking event",
  "Startup event",
  "Company challenge/debug challenge",
  "Grants",
  "Competitions",
  "Fellowships",
  "AI challenges",
  "Other"
];

export const OPPORTUNITY_APPLICATION_DEFAULTS: Record<OpportunityType, ApplicationMethod> = {
  Hackathon: "external_registration",
  Workshop: "external_registration",
  Webinar: "external_registration",
  "Networking event": "external_registration",
  "Startup event": "external_registration",
  "Investor opportunity": "idea_workspace_application",
  "Incubator program": "idea_workspace_application",
  "Accelerator program": "idea_workspace_application",
  "Startup competition": "external_registration",
  "Company challenge/debug challenge": "external_registration",
  Grants: "idea_workspace_application",
  Competitions: "external_registration",
  Fellowships: "external_registration",
  "AI challenges": "external_registration",
  Other: "information_only"
};

const APPLICATION_DEFAULTS_STORAGE_KEY = "venture-connect-opportunity-application-defaults";

export const ORGANIZER_SELECTED_OPPORTUNITY_TYPES: OpportunityType[] = [
  "Incubator program",
  "Accelerator program",
  "Startup competition",
  "Company challenge/debug challenge",
  "Competitions",
  "Other"
];

export function defaultApplicationMethodForType(type: OpportunityType) {
  return OPPORTUNITY_APPLICATION_DEFAULTS[type];
}

export function getConfiguredApplicationDefaults(): Record<OpportunityType, ApplicationMethod> {
  if (typeof window === "undefined") return { ...OPPORTUNITY_APPLICATION_DEFAULTS };

  try {
    const stored = JSON.parse(window.localStorage.getItem(APPLICATION_DEFAULTS_STORAGE_KEY) ?? "{}") as Partial<Record<OpportunityType, ApplicationMethod>>;
    const configured = { ...OPPORTUNITY_APPLICATION_DEFAULTS };
    OPPORTUNITY_TYPE_OPTIONS.forEach((type) => {
      const method = stored[type];
      if (method && method in APPLICATION_METHOD_LABELS) configured[type] = method;
    });
    return configured;
  } catch {
    return { ...OPPORTUNITY_APPLICATION_DEFAULTS };
  }
}

export function saveConfiguredApplicationDefault(type: OpportunityType, method: ApplicationMethod) {
  if (typeof window === "undefined") return;
  const configured = getConfiguredApplicationDefaults();
  configured[type] = method;
  window.localStorage.setItem(APPLICATION_DEFAULTS_STORAGE_KEY, JSON.stringify(configured));
}

export function getOpportunityApplicationMethod(
  opportunity: Pick<Opportunity, "application_method" | "opportunity_type">
) {
  return opportunity.application_method ?? defaultApplicationMethodForType(opportunity.opportunity_type);
}

export function applicationMethodNeedsExternalUrl(method: ApplicationMethod) {
  return method === "external_registration" || method === "hybrid_application";
}

export function applicationMethodUsesWorkspace(method: ApplicationMethod) {
  return method === "idea_workspace_application";
}

export function isExternallyManagedApplication(method: ApplicationMethod) {
  return method === "external_registration" || method === "hybrid_application";
}

export type SafeExternalUrlResult =
  | { valid: true; url: string; domain: string }
  | { valid: false; error: string };

export function validateExternalRegistrationUrl(value?: string | null): SafeExternalUrlResult {
  const input = value?.trim();
  if (!input) return { valid: false, error: "The organiser has not provided an official registration URL." };

  try {
    const parsed = new URL(input);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Only http or https organiser links are allowed." };
    }
    if (parsed.username || parsed.password) {
      return { valid: false, error: "Registration links containing embedded credentials are not allowed." };
    }

    const hostname = parsed.hostname.toLowerCase();
    const unwrappedHostname = hostname.replace(/^\[|\]$/g, "");
    const privateIpv6 =
      unwrappedHostname === "::" ||
      unwrappedHostname === "::1" ||
      /^f[cd][0-9a-f]{0,2}:/i.test(unwrappedHostname) ||
      /^fe[89ab][0-9a-f]?:/i.test(unwrappedHostname) ||
      /^::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(unwrappedHostname);
    const privateNetwork =
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      privateIpv6 ||
      hostname.endsWith(".local") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    if (!hostname || privateNetwork) {
      return { valid: false, error: "The registration destination is not a public organiser website." };
    }

    parsed.hash = "";
    return { valid: true, url: parsed.toString(), domain: hostname };
  } catch {
    return { valid: false, error: "The official registration URL is malformed." };
  }
}

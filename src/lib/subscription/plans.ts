import type { Entitlements, Profile, ReportType, SubscriptionPlan } from "@/lib/types";

type PlanLimits = {
  premiumReportsPerMonth: number;
  messaging: boolean;
  allTemplates: boolean;
  workspacesLimit: number | "unlimited";
  opportunitySubmissionsPerMonth: number;
  reportTypes: ReportType[];
};

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  Free: {
    premiumReportsPerMonth: 0,
    messaging: false,
    allTemplates: false,
    workspacesLimit: 1,
    opportunitySubmissionsPerMonth: 1,
    reportTypes: ["Basic SWOT Report"]
  },
  "Student Pro": {
    premiumReportsPerMonth: 3,
    messaging: true,
    allTemplates: true,
    workspacesLimit: "unlimited",
    opportunitySubmissionsPerMonth: 10,
    reportTypes: ["Premium SWOT Analysis", "Full Brief Report", "Bottleneck Report", "Competitor Defensive Report"]
  },
  "Founder Pro": {
    premiumReportsPerMonth: 5,
    messaging: true,
    allTemplates: true,
    workspacesLimit: "unlimited",
    opportunitySubmissionsPerMonth: 30,
    reportTypes: [
      "Premium SWOT Analysis",
      "Full Brief Report",
      "Bottleneck Report",
      "Competitor Defensive Report",
      "Roadmap Report",
      "Investor Scorecard Report"
    ]
  }
};

export const PLAN_PRICES: Record<Exclude<SubscriptionPlan, "Free">, number> = {
  "Student Pro": 14900,
  "Founder Pro": 19900
};

export const PRICING_TIERS = [
  {
    name: "Student Pro" as const,
    price: "Rs 149/month",
    priceAmount: 14900,
    description: "Unlimited Idea Workspaces, all templates, 10 submissions, 3 premium reports, and gated messaging.",
    features: [
      "Unlimited Idea Workspaces",
      "All document templates",
      "10 opportunity submissions per month",
      "3 premium VC Readiness Reports per month",
      "PDF and DOCX exports",
      "Messaging after investor/incubator interest"
    ],
    highlighted: false,
    razorpayPlanId: process.env.RAZORPAY_PLAN_STUDENT_PRO
  },
  {
    name: "Founder Pro" as const,
    price: "Rs 199/month",
    priceAmount: 19900,
    description: "More submissions, 5 premium reports, priority generation, premium badge, and advanced reports.",
    features: [
      "Everything in Student Pro",
      "30 opportunity submissions per month",
      "5 premium reports per month",
      "Priority report generation",
      "Roadmap Report",
      "Investor Scorecard Report"
    ],
    highlighted: true,
    razorpayPlanId: process.env.RAZORPAY_PLAN_FOUNDER_PRO
  }
];

export function normalizeSubscriptionPlan(plan?: string | null): SubscriptionPlan {
  const value = plan?.trim().toLowerCase().replace(/[- ]/g, "_");
  if (value === "student_pro" || value === "starter") return "Student Pro";
  if (value === "founder_pro" || value === "growth") return "Founder Pro";
  return "Free";
}

export function computeEntitlements(profile: Profile): Entitlements {
  const plan = normalizeSubscriptionPlan(profile.plan);
  const limits = PLAN_LIMITS[plan];
  const currentUsageMonth = new Date().toISOString().slice(0, 7);
  const recordedUsageMonth = profile.reports_month_reset?.match(/^(\d{4})-(0[1-9]|1[0-2])(?:-|$)/)?.[0].slice(0, 7);
  const needsReset = Boolean(recordedUsageMonth && recordedUsageMonth !== currentUsageMonth);
  const recordedUsage = Number.isFinite(profile.reports_used_this_month)
    ? Math.max(0, profile.reports_used_this_month)
    : 0;
  const used = needsReset ? 0 : recordedUsage;

  return {
    plan,
    messagingEnabled: limits.messaging || profile.role !== "Founder",
    allTemplatesEnabled: limits.allTemplates,
    premiumReportsPerMonth: limits.premiumReportsPerMonth,
    reportsRemaining: Math.max(0, limits.premiumReportsPerMonth - used),
    freeReportAvailable: !profile.free_report_used,
    workspacesLimit: limits.workspacesLimit,
    opportunitySubmissionsPerMonth: limits.opportunitySubmissionsPerMonth,
    reportTypes: limits.reportTypes
  };
}

export function canGenerateReport(profile: Profile, reportTypeOrTier: ReportType | "free" | "premium"): { allowed: boolean; reason?: string } {
  const entitlements = computeEntitlements(profile);
  const reportType: ReportType =
    reportTypeOrTier === "free"
      ? "Basic SWOT Report"
      : reportTypeOrTier === "premium"
        ? "Premium SWOT Analysis"
        : reportTypeOrTier;

  if (reportType === "Basic SWOT Report") {
    if (!entitlements.freeReportAvailable) {
      return { allowed: false, reason: "Free Basic SWOT Report is one-time only. Upgrade for premium reports." };
    }
    return { allowed: true };
  }

  if (!entitlements.reportTypes.includes(reportType)) {
    return { allowed: false, reason: `${reportType} is not included in the ${entitlements.plan} plan.` };
  }

  if (entitlements.reportsRemaining <= 0) {
    return { allowed: false, reason: "Monthly premium report limit reached. It resets next month." };
  }

  return { allowed: true };
}

export function canAccessMessaging(profile: Profile): boolean {
  return computeEntitlements(profile).messagingEnabled;
}

export function canUseTemplate(profile: Profile, templateIndex: number): boolean {
  return templateIndex === 0 || computeEntitlements(profile).allTemplatesEnabled;
}

import type { ReportSection, ReportType, SubscriptionPlan, VcReportContent } from "@/lib/types";

export const REPORT_TYPES = [
  "Basic SWOT Report",
  "Premium SWOT Analysis",
  "Full Brief Report",
  "Bottleneck Report",
  "Competitor Defensive Report",
  "Roadmap Report",
  "Investor Scorecard Report"
] as const satisfies readonly ReportType[];

export const FINAL_RECOMMENDATIONS = [
  "Not Ready",
  "Needs Validation",
  "Incubator Ready",
  "Investor Conversation Ready",
  "Strong Candidate"
] as const;

type FinalRecommendation = (typeof FINAL_RECOMMENDATIONS)[number];
type RiskRating = "Low" | "Medium" | "High" | "Critical";

type ReportPayloadBase<T extends ReportType> = {
  startupName: string;
  reportType: T;
  overallScore: number;
  finalRecommendation: FinalRecommendation;
};

export type BasicSwotReportPayload = ReportPayloadBase<"Basic SWOT Report"> & {
  executiveSummary: string;
  problemClarity: number;
  solutionClarity: number;
  customerClarity: number;
  validationLevel: number;
  businessModelClarity: number;
  teamReadiness: number;
  strengths: string[];
  weaknesses: string[];
  priorityActions: string[];
  disclaimer: string;
};

export type PremiumSwotReportPayload = ReportPayloadBase<"Premium SWOT Analysis"> & {
  detailedStrengths: string[];
  detailedWeaknesses: string[];
  marketOpportunities: string[];
  executionThreats: string[];
  founderReadiness: string;
  riskRating: RiskRating;
  prioritizedImprovements: string[];
};

export type FullBriefReportPayload = ReportPayloadBase<"Full Brief Report"> & {
  executiveSummary: string;
  problemClarity: string;
  solutionStrength: string;
  targetUsers: string;
  businessModel: string;
  marketOpportunity: string;
  competitivePosition: string;
  teamReadiness: string;
  executionRisks: string[];
  investmentReadiness: string;
  recommendations: string[];
};

export type BottleneckReportPayload = ReportPayloadBase<"Bottleneck Report"> & {
  criticalBlockers: string[];
  productBottlenecks: string[];
  marketBottlenecks: string[];
  teamBottlenecks: string[];
  executionBottlenecks: string[];
  revenueBottlenecks: string[];
  priorityFixes: string[];
};

export type CompetitorDefensiveReportPayload = ReportPayloadBase<"Competitor Defensive Report"> & {
  competitorLandscape: string[];
  differentiation: string[];
  moatStrength: string;
  copyRisk: string[];
  distributionAdvantage: string;
  defensibilityScore: number;
  strategicRecommendations: string[];
};

export type RoadmapReportPayload = ReportPayloadBase<"Roadmap Report"> & {
  next30Days: string[];
  next90Days: string[];
  sixMonthPlan: string[];
  productMilestones: string[];
  validationMilestones: string[];
  tractionMilestones: string[];
  revenueMilestones: string[];
  fundraisingMilestones: string[];
};

export type InvestorScorecardReportPayload = ReportPayloadBase<"Investor Scorecard Report"> & {
  investorReadinessScore: number;
  marketPotentialScore: number;
  productClarityScore: number;
  businessModelScore: number;
  teamScore: number;
  tractionScore: number;
  riskScore: number;
};

export type StructuredReportPayload =
  | BasicSwotReportPayload
  | PremiumSwotReportPayload
  | FullBriefReportPayload
  | BottleneckReportPayload
  | CompetitorDefensiveReportPayload
  | RoadmapReportPayload
  | InvestorScorecardReportPayload;

export class ReportValidationError extends Error {
  constructor(message = "The AI response did not match the required VC Readiness Report structure.") {
    super(message);
    this.name = "ReportValidationError";
  }
}

const textSchema = { type: "string" } as const;
const scoreSchema = { type: "integer", minimum: 0, maximum: 100 } as const;
const stringListSchema = { type: "array", items: textSchema, minItems: 1, maxItems: 10 } as const;

const reportFields: Record<ReportType, Record<string, unknown>> = {
  "Basic SWOT Report": {
    executiveSummary: textSchema,
    problemClarity: scoreSchema,
    solutionClarity: scoreSchema,
    customerClarity: scoreSchema,
    validationLevel: scoreSchema,
    businessModelClarity: scoreSchema,
    teamReadiness: scoreSchema,
    strengths: stringListSchema,
    weaknesses: stringListSchema,
    priorityActions: stringListSchema,
    disclaimer: textSchema
  },
  "Premium SWOT Analysis": {
    detailedStrengths: stringListSchema,
    detailedWeaknesses: stringListSchema,
    marketOpportunities: stringListSchema,
    executionThreats: stringListSchema,
    founderReadiness: textSchema,
    riskRating: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
    prioritizedImprovements: stringListSchema
  },
  "Full Brief Report": {
    executiveSummary: textSchema,
    problemClarity: textSchema,
    solutionStrength: textSchema,
    targetUsers: textSchema,
    businessModel: textSchema,
    marketOpportunity: textSchema,
    competitivePosition: textSchema,
    teamReadiness: textSchema,
    executionRisks: stringListSchema,
    investmentReadiness: textSchema,
    recommendations: stringListSchema
  },
  "Bottleneck Report": {
    criticalBlockers: stringListSchema,
    productBottlenecks: stringListSchema,
    marketBottlenecks: stringListSchema,
    teamBottlenecks: stringListSchema,
    executionBottlenecks: stringListSchema,
    revenueBottlenecks: stringListSchema,
    priorityFixes: stringListSchema
  },
  "Competitor Defensive Report": {
    competitorLandscape: stringListSchema,
    differentiation: stringListSchema,
    moatStrength: textSchema,
    copyRisk: stringListSchema,
    distributionAdvantage: textSchema,
    defensibilityScore: scoreSchema,
    strategicRecommendations: stringListSchema
  },
  "Roadmap Report": {
    next30Days: stringListSchema,
    next90Days: stringListSchema,
    sixMonthPlan: stringListSchema,
    productMilestones: stringListSchema,
    validationMilestones: stringListSchema,
    tractionMilestones: stringListSchema,
    revenueMilestones: stringListSchema,
    fundraisingMilestones: stringListSchema
  },
  "Investor Scorecard Report": {
    investorReadinessScore: scoreSchema,
    marketPotentialScore: scoreSchema,
    productClarityScore: scoreSchema,
    businessModelScore: scoreSchema,
    teamScore: scoreSchema,
    tractionScore: scoreSchema,
    riskScore: scoreSchema
  }
};

const baseFieldNames = ["startupName", "reportType", "overallScore", "finalRecommendation"] as const;

export function isReportType(value: unknown): value is ReportType {
  return typeof value === "string" && REPORT_TYPES.includes(value as ReportType);
}

export function reportPlanRequired(reportType: ReportType): SubscriptionPlan {
  if (reportType === "Basic SWOT Report") return "Free";
  if (reportType === "Roadmap Report" || reportType === "Investor Scorecard Report") return "Founder Pro";
  return "Student Pro";
}

export function buildReportJsonSchema(reportType: ReportType): Record<string, unknown> {
  const specific = reportFields[reportType];
  const properties = {
    startupName: textSchema,
    reportType: { type: "string", enum: [reportType] },
    overallScore: scoreSchema,
    finalRecommendation: { type: "string", enum: FINAL_RECOMMENDATIONS },
    ...specific
  };

  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties)
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ReportValidationError();
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string, maxLength = 3000): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new ReportValidationError();
  return value.trim();
}

function readList(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) throw new ReportValidationError();
  return value.map((item) => {
    if (typeof item !== "string" || !item.trim() || item.length > 700) throw new ReportValidationError();
    return item.trim();
  });
}

function readScore(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100) throw new ReportValidationError();
  return value as number;
}

function readFinalRecommendation(record: Record<string, unknown>, key: string): FinalRecommendation {
  const value = record[key];
  if (typeof value !== "string" || !FINAL_RECOMMENDATIONS.includes(value as FinalRecommendation)) {
    throw new ReportValidationError();
  }
  return value as FinalRecommendation;
}

function readRisk(record: Record<string, unknown>, key: string): RiskRating {
  const value = record[key];
  if (value !== "Low" && value !== "Medium" && value !== "High" && value !== "Critical") {
    throw new ReportValidationError();
  }
  return value;
}

export function validateStructuredReportPayload(value: unknown, expectedType: ReportType): StructuredReportPayload {
  const record = asRecord(value);
  const expectedFields = new Set([...baseFieldNames, ...Object.keys(reportFields[expectedType])]);
  if (Object.keys(record).length !== expectedFields.size || Object.keys(record).some((key) => !expectedFields.has(key))) {
    throw new ReportValidationError();
  }
  if (record.reportType !== expectedType) throw new ReportValidationError();

  const base = {
    startupName: readString(record, "startupName", 180),
    overallScore: readScore(record, "overallScore"),
    finalRecommendation: readFinalRecommendation(record, "finalRecommendation")
  };

  switch (expectedType) {
    case "Basic SWOT Report":
      return {
        ...base,
        reportType: expectedType,
        executiveSummary: readString(record, "executiveSummary"),
        problemClarity: readScore(record, "problemClarity"),
        solutionClarity: readScore(record, "solutionClarity"),
        customerClarity: readScore(record, "customerClarity"),
        validationLevel: readScore(record, "validationLevel"),
        businessModelClarity: readScore(record, "businessModelClarity"),
        teamReadiness: readScore(record, "teamReadiness"),
        strengths: readList(record, "strengths"),
        weaknesses: readList(record, "weaknesses"),
        priorityActions: readList(record, "priorityActions"),
        disclaimer: readString(record, "disclaimer")
      };
    case "Premium SWOT Analysis":
      return {
        ...base,
        reportType: expectedType,
        detailedStrengths: readList(record, "detailedStrengths"),
        detailedWeaknesses: readList(record, "detailedWeaknesses"),
        marketOpportunities: readList(record, "marketOpportunities"),
        executionThreats: readList(record, "executionThreats"),
        founderReadiness: readString(record, "founderReadiness"),
        riskRating: readRisk(record, "riskRating"),
        prioritizedImprovements: readList(record, "prioritizedImprovements")
      };
    case "Full Brief Report":
      return {
        ...base,
        reportType: expectedType,
        executiveSummary: readString(record, "executiveSummary"),
        problemClarity: readString(record, "problemClarity"),
        solutionStrength: readString(record, "solutionStrength"),
        targetUsers: readString(record, "targetUsers"),
        businessModel: readString(record, "businessModel"),
        marketOpportunity: readString(record, "marketOpportunity"),
        competitivePosition: readString(record, "competitivePosition"),
        teamReadiness: readString(record, "teamReadiness"),
        executionRisks: readList(record, "executionRisks"),
        investmentReadiness: readString(record, "investmentReadiness"),
        recommendations: readList(record, "recommendations")
      };
    case "Bottleneck Report":
      return {
        ...base,
        reportType: expectedType,
        criticalBlockers: readList(record, "criticalBlockers"),
        productBottlenecks: readList(record, "productBottlenecks"),
        marketBottlenecks: readList(record, "marketBottlenecks"),
        teamBottlenecks: readList(record, "teamBottlenecks"),
        executionBottlenecks: readList(record, "executionBottlenecks"),
        revenueBottlenecks: readList(record, "revenueBottlenecks"),
        priorityFixes: readList(record, "priorityFixes")
      };
    case "Competitor Defensive Report":
      return {
        ...base,
        reportType: expectedType,
        competitorLandscape: readList(record, "competitorLandscape"),
        differentiation: readList(record, "differentiation"),
        moatStrength: readString(record, "moatStrength"),
        copyRisk: readList(record, "copyRisk"),
        distributionAdvantage: readString(record, "distributionAdvantage"),
        defensibilityScore: readScore(record, "defensibilityScore"),
        strategicRecommendations: readList(record, "strategicRecommendations")
      };
    case "Roadmap Report":
      return {
        ...base,
        reportType: expectedType,
        next30Days: readList(record, "next30Days"),
        next90Days: readList(record, "next90Days"),
        sixMonthPlan: readList(record, "sixMonthPlan"),
        productMilestones: readList(record, "productMilestones"),
        validationMilestones: readList(record, "validationMilestones"),
        tractionMilestones: readList(record, "tractionMilestones"),
        revenueMilestones: readList(record, "revenueMilestones"),
        fundraisingMilestones: readList(record, "fundraisingMilestones")
      };
    case "Investor Scorecard Report":
      return {
        ...base,
        reportType: expectedType,
        investorReadinessScore: readScore(record, "investorReadinessScore"),
        marketPotentialScore: readScore(record, "marketPotentialScore"),
        productClarityScore: readScore(record, "productClarityScore"),
        businessModelScore: readScore(record, "businessModelScore"),
        teamScore: readScore(record, "teamScore"),
        tractionScore: readScore(record, "tractionScore"),
        riskScore: readScore(record, "riskScore")
      };
  }
}

export function parseStructuredReportOutput(raw: string, reportType: ReportType): StructuredReportPayload {
  if (!raw.trim() || raw.length > 64_000) throw new ReportValidationError();
  const withoutFence = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const candidates = [withoutFence];
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const extracted = withoutFence.slice(firstBrace, lastBrace + 1);
    if (extracted !== withoutFence) candidates.push(extracted);
  }

  for (const candidate of candidates) {
    try {
      return validateStructuredReportPayload(JSON.parse(candidate), reportType);
    } catch {
      // One conservative cleanup/parsing retry is allowed using the extracted JSON object.
    }
  }
  throw new ReportValidationError();
}

function section(title: string, body?: string, items?: string[], score?: number): ReportSection {
  return { title, ...(body ? { body } : {}), ...(items ? { items } : {}), ...(score === undefined ? {} : { score }) };
}

export function toVcReportContent(payload: StructuredReportPayload): VcReportContent {
  let sections: ReportSection[];
  let summary: string;
  let suggestions: string[];

  switch (payload.reportType) {
    case "Basic SWOT Report":
      summary = payload.executiveSummary;
      suggestions = payload.priorityActions;
      sections = [
        section("Problem clarity", undefined, undefined, payload.problemClarity),
        section("Solution clarity", undefined, undefined, payload.solutionClarity),
        section("Customer clarity", undefined, undefined, payload.customerClarity),
        section("Validation level", undefined, undefined, payload.validationLevel),
        section("Business-model clarity", undefined, undefined, payload.businessModelClarity),
        section("Team readiness", undefined, undefined, payload.teamReadiness),
        section("Strengths", undefined, payload.strengths),
        section("Weaknesses", undefined, payload.weaknesses),
        section("Disclaimer", payload.disclaimer)
      ];
      break;
    case "Premium SWOT Analysis":
      summary = payload.founderReadiness;
      suggestions = payload.prioritizedImprovements;
      sections = [
        section("Detailed strengths", undefined, payload.detailedStrengths),
        section("Detailed weaknesses", undefined, payload.detailedWeaknesses),
        section("Market opportunities", undefined, payload.marketOpportunities),
        section("Execution threats", undefined, payload.executionThreats),
        section("Founder readiness", `${payload.founderReadiness} Risk rating: ${payload.riskRating}.`)
      ];
      break;
    case "Full Brief Report":
      summary = payload.executiveSummary;
      suggestions = payload.recommendations;
      sections = [
        section("Executive summary", payload.executiveSummary),
        section("Problem clarity", payload.problemClarity),
        section("Solution strength", payload.solutionStrength),
        section("Target users", payload.targetUsers),
        section("Business model", payload.businessModel),
        section("Market opportunity", payload.marketOpportunity),
        section("Competitive position", payload.competitivePosition),
        section("Team readiness", payload.teamReadiness),
        section("Execution risks", undefined, payload.executionRisks),
        section("Investment readiness", payload.investmentReadiness)
      ];
      break;
    case "Bottleneck Report":
      summary = payload.criticalBlockers.join(" ");
      suggestions = payload.priorityFixes;
      sections = [
        section("Critical blockers", undefined, payload.criticalBlockers),
        section("Product bottlenecks", undefined, payload.productBottlenecks),
        section("Market bottlenecks", undefined, payload.marketBottlenecks),
        section("Team bottlenecks", undefined, payload.teamBottlenecks),
        section("Execution bottlenecks", undefined, payload.executionBottlenecks),
        section("Revenue bottlenecks", undefined, payload.revenueBottlenecks),
        section("Priority fixes", undefined, payload.priorityFixes)
      ];
      break;
    case "Competitor Defensive Report":
      summary = payload.moatStrength;
      suggestions = payload.strategicRecommendations;
      sections = [
        section("Competitor landscape", undefined, payload.competitorLandscape),
        section("Differentiation", undefined, payload.differentiation),
        section("Moat strength", payload.moatStrength, undefined, payload.defensibilityScore),
        section("Copy risk", undefined, payload.copyRisk),
        section("Distribution advantage", payload.distributionAdvantage),
        section("Strategic recommendations", undefined, payload.strategicRecommendations)
      ];
      break;
    case "Roadmap Report":
      summary = payload.sixMonthPlan.join(" ");
      suggestions = payload.next30Days;
      sections = [
        section("Next 30 days", undefined, payload.next30Days),
        section("Next 90 days", undefined, payload.next90Days),
        section("Six-month plan", undefined, payload.sixMonthPlan),
        section("Product milestones", undefined, payload.productMilestones),
        section("Validation milestones", undefined, payload.validationMilestones),
        section("Traction milestones", undefined, payload.tractionMilestones),
        section("Revenue milestones", undefined, payload.revenueMilestones),
        section("Fundraising milestones", undefined, payload.fundraisingMilestones)
      ];
      break;
    case "Investor Scorecard Report":
      summary = `Overall investor readiness is ${payload.overallScore}/100 with a ${payload.finalRecommendation} recommendation.`;
      suggestions = ["Address the lowest-scoring evidence area before the next investor conversation."];
      sections = [
        section("Investor readiness score", undefined, undefined, payload.investorReadinessScore),
        section("Market potential score", undefined, undefined, payload.marketPotentialScore),
        section("Product clarity score", undefined, undefined, payload.productClarityScore),
        section("Business-model score", undefined, undefined, payload.businessModelScore),
        section("Team score", undefined, undefined, payload.teamScore),
        section("Traction score", undefined, undefined, payload.tractionScore),
        section("Risk score", undefined, undefined, payload.riskScore)
      ];
      break;
  }

  return {
    tier: payload.reportType === "Basic SWOT Report" ? "free" : "premium",
    reportType: payload.reportType,
    planRequired: reportPlanRequired(payload.reportType),
    startupName: payload.startupName,
    summary,
    overallScore: payload.overallScore,
    finalRecommendation: payload.finalRecommendation,
    sections,
    improvementSuggestions: suggestions,
    structuredData: payload,
    generatedAt: new Date().toISOString()
  };
}

export function isStoredVcReportContent(value: unknown): value is VcReportContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const report = value as Partial<VcReportContent>;
  return Boolean(
    isReportType(report.reportType) &&
    typeof report.overallScore === "number" &&
    report.overallScore >= 0 &&
    report.overallScore <= 100 &&
    Array.isArray(report.sections) &&
    Array.isArray(report.improvementSuggestions) &&
    typeof report.generatedAt === "string"
  );
}

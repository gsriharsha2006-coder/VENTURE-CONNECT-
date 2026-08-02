import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { runDeterministicQualityCheck } from "@/lib/application-quality/engine";
import { ApplicationQualityProviderError, generateSemanticQualityReview } from "@/lib/application-quality/openai";
import type { ApplicationDraft, EligibilityRules, QualityCheckStatus } from "@/lib/application-quality/types";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_CHECKS_PER_WINDOW = 5;
const MAX_APPLICATION_CHECKS = 2;
const CORE_PITCH_FIELDS = [
  "startupName", "founderName", "sector", "startupStage", "founderLocation",
  "problem", "solution", "targetCustomer", "marketOpportunity", "businessModel",
  "competitors", "differentiation", "productTechnology", "customerValidation",
  "traction", "goToMarket", "team", "fundingRequirement", "useOfFunds", "risks"
];
const rateState = globalThis as typeof globalThis & { __applicationQualityRate?: Map<string, number[]> };
const rates = rateState.__applicationQualityRate ?? new Map<string, number[]>();
rateState.__applicationQualityRate = rates;

function enforceRateLimit(profileId: string) {
  const now = Date.now();
  const recent = (rates.get(profileId) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= MAX_CHECKS_PER_WINDOW) throw new AuthorizationError(429, "Application Quality Check limit reached. Try again later.");
  recent.push(now);
  rates.set(profileId, recent);
}

function fingerprint(draft: ApplicationDraft) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

function deriveStatus(score: number, contradictions: string[]): QualityCheckStatus {
  if (contradictions.length) return "manual_review";
  if (score >= 70) return "ready_to_submit";
  if (score >= 45) return "needs_revision";
  return "incomplete";
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireRole(["founder"]);
    const db = supabase as unknown as SupabaseClient;
    const service = createServiceClient() as SupabaseClient | null;
    if (!service) throw new AuthorizationError(503, "Application Quality Check requires server configuration.");
    const serviceDb = service;

    const { data: application, error: applicationError } = await db
      .from("applications")
      .select("id, opportunity_id, founder_profile_id, answers_json, status")
      .eq("id", id)
      .eq("founder_profile_id", profile.id)
      .maybeSingle();
    if (applicationError || !application) throw new AuthorizationError(404, "Application draft not found.");
    if (String(application.status).toLowerCase() === "submitted") throw new AuthorizationError(409, "Submitted applications cannot be rechecked or edited.");
    const applicationRecord = application;

    const { data: opportunity, error: opportunityError } = await db
      .from("opportunities")
      .select("id, organisation_id, deadline, eligibility_rules, required_application_fields")
      .eq("id", application.opportunity_id)
      .maybeSingle();
    if (opportunityError || !opportunity) throw new AuthorizationError(409, "Opportunity criteria are unavailable.");
    const opportunityRecord = opportunity;

    const answers = (application.answers_json && typeof application.answers_json === "object" ? application.answers_json : {}) as Record<string, string | number | boolean | string[] | null>;
    const storedRules = (opportunity.eligibility_rules && typeof opportunity.eligibility_rules === "object" ? opportunity.eligibility_rules : {}) as EligibilityRules;
    const rules: EligibilityRules = { ...storedRules, deadline: storedRules.deadline ?? (String(opportunity.deadline ?? "") || undefined) };
    const fundingValue = typeof answers.fundingRequirement === "number"
      ? answers.fundingRequirement
      : typeof answers.fundingRequirement === "string" && answers.fundingRequirement.trim()
        ? Number(answers.fundingRequirement)
        : undefined;
    const configuredRequiredFields = Array.isArray(opportunity.required_application_fields) ? opportunity.required_application_fields.filter((value): value is string => typeof value === "string") : [];
    const draft: ApplicationDraft = {
      applicationId: application.id,
      opportunityId: opportunity.id,
      sector: String(answers.sector ?? ""),
      startupStage: String(answers.startupStage ?? "Idea") as ApplicationDraft["startupStage"],
      geography: String(answers.founderLocation ?? ""),
      college: typeof answers.college === "string" ? answers.college : undefined,
      fundingRequirement: fundingValue,
      answers,
      requiredFields: Array.from(new Set([...CORE_PITCH_FIELDS, ...configuredRequiredFields, ...(rules.mandatoryLinks ?? [])]))
    };
    const deterministic = runDeterministicQualityCheck(draft, rules);
    const inputFingerprint = fingerprint(draft);

    const { data: cached } = await db
      .from("application_quality_checks")
      .select("result_json")
      .eq("application_id", application.id)
      .eq("input_fingerprint", inputFingerprint)
      .eq("is_current", true)
      .maybeSingle();
    if (cached?.result_json) {
      return NextResponse.json({ result: cached.result_json, cached: true });
    }

    enforceRateLimit(profile.id);
    const { count: applicationChecks, error: countError } = await serviceDb
      .from("application_quality_checks")
      .select("id", { count: "exact", head: true })
      .eq("application_id", application.id);
    if (countError) throw new Error("Application Quality Check usage could not be verified.");
    if ((applicationChecks ?? 0) >= MAX_APPLICATION_CHECKS) {
      throw new AuthorizationError(429, "This pilot application has used its initial quality check and one recheck.");
    }

    async function saveResult(result: Record<string, unknown>, model: string | null, usage: unknown) {
      const { error: retireError } = await serviceDb
        .from("application_quality_checks")
        .update({ is_current: false })
        .eq("application_id", applicationRecord.id)
        .eq("is_current", true);
      if (retireError) throw new Error("The previous Application Quality Check could not be updated.");

      const { error: insertError } = await serviceDb.from("application_quality_checks").insert({
        application_id: applicationRecord.id,
        founder_profile_id: profile.id,
        organisation_id: opportunityRecord.organisation_id,
        input_fingerprint: inputFingerprint,
        status: result.status,
        score: result.qualityScore,
        result_json: result,
        is_current: true,
        semantic_model: model,
        usage_json: usage
      });
      if (insertError) throw new Error("Application Quality Check could not be saved.");

      const { error: applicationUpdateError } = await serviceDb
        .from("applications")
        .update({
          quality_status: result.status,
          quality_checked_at: result.checkedAt,
          quality_input_fingerprint: inputFingerprint
        })
        .eq("id", applicationRecord.id)
        .eq("founder_profile_id", profile.id);
      if (applicationUpdateError) throw new Error("Application quality status could not be updated.");
      await serviceDb.from("pilot_events").insert({
        profile_id: profile.id,
        event_name: result.status === "ready_to_submit" ? "quality_check_passed" : "quality_check_failed",
        metadata: { applicationId: applicationRecord.id, status: result.status, score: result.qualityScore }
      });
    }

    if (!deterministic.semanticReviewRequired) {
      const result = { ...deterministic, inputFingerprint };
      await saveResult(result, null, null);
      return NextResponse.json({ result, semanticSkipped: true });
    }

    const semantic = await generateSemanticQualityReview(draft, rules);
    const result = {
      ...semantic.result,
      eligibility: deterministic.eligibility,
      eligibilityMismatches: deterministic.eligibilityMismatches,
      status: deriveStatus(semantic.result.qualityScore, semantic.result.contradictoryClaims),
      semanticReviewRequired: false,
      checkedAt: new Date().toISOString(),
      inputFingerprint
    };
    await saveResult(result, semantic.model, semantic.usage);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ApplicationQualityProviderError) {
      const status = error.code === "RATE_LIMIT" ? 429 : error.code === "TIMEOUT" ? 504 : 503;
      return NextResponse.json({ error: error.message, code: error.code, retryable: true }, { status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Application Quality Check failed." }, { status: 500 });
  }
}

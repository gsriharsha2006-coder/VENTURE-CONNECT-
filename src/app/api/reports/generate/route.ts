import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { getAIProvider, AIProviderError } from "@/lib/aiProvider";
import { isReportType, isStoredVcReportContent } from "@/lib/ai/reportSchema";
import { canGenerateReport, normalizeSubscriptionPlan } from "@/lib/subscription/plans";
import { completionPercent } from "@/lib/templates";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, ReportType, SubscriptionPlan, WorkspaceTemplate } from "@/lib/types";

export const runtime = "nodejs";

const MAX_REQUEST_LENGTH = 64_000;
const MAX_WORKSPACE_INPUT_LENGTH = 48_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = ["startup"];

type PrototypeWorkspace = {
  name: string;
  template: WorkspaceTemplate;
  sections: Record<string, string>;
};

type ReportRequest = {
  requestId: string;
  workspaceId: string;
  reportType: ReportType;
  prototypeWorkspace?: PrototypeWorkspace;
};

type RateBucket = { startedAt: number; count: number };
type ReportRuntimeState = {
  rateBuckets: Map<string, RateBucket>;
  inFlight: Set<string>;
};

const globalReportState = globalThis as typeof globalThis & { __ventureConnectReportState?: ReportRuntimeState };
const runtimeState = globalReportState.__ventureConnectReportState ?? {
  rateBuckets: new Map<string, RateBucket>(),
  inFlight: new Set<string>()
};
globalReportState.__ventureConnectReportState = runtimeState;

class RequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "RequestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sanitizeSections(value: unknown): Record<string, string> {
  if (!isRecord(value) || Object.keys(value).length > 80) throw new RequestError(400, "Invalid Idea Workspace sections.");
  const sections: Record<string, string> = {};
  for (const [key, sectionValue] of Object.entries(value)) {
    if (!key.trim() || key.length > 100 || typeof sectionValue !== "string" || sectionValue.length > 8_000) {
      throw new RequestError(400, "Invalid Idea Workspace sections.");
    }
    sections[key] = sectionValue.trim();
  }
  if (JSON.stringify(sections).length > MAX_WORKSPACE_INPUT_LENGTH) {
    throw new RequestError(413, "The selected Idea Workspace is too large for report generation.");
  }
  return sections;
}

function parsePrototypeWorkspace(value: unknown): PrototypeWorkspace {
  if (!isRecord(value)) throw new RequestError(400, "Prototype workspace data is required in development mode.");
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const template = value.template as WorkspaceTemplate;
  if (!name || name.length > 180 || !WORKSPACE_TEMPLATES.includes(template)) {
    throw new RequestError(400, "Invalid prototype Idea Workspace.");
  }
  return { name, template, sections: sanitizeSections(value.sections) };
}

async function parseRequest(request: Request): Promise<ReportRequest> {
  const raw = await request.text();
  if (!raw || raw.length > MAX_REQUEST_LENGTH) throw new RequestError(413, "Report request is empty or too large.");

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new RequestError(400, "Invalid JSON request body.");
  }
  if (!isRecord(value)) throw new RequestError(400, "Invalid report request.");

  const allowedKeys = new Set(["requestId", "workspaceId", "reportType", "prototypeWorkspace"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new RequestError(400, "Unsupported report request field.");
  }

  const requestId = typeof value.requestId === "string" ? value.requestId.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new RequestError(400, "A valid report request ID is required.");
  }
  const workspaceId = typeof value.workspaceId === "string" ? value.workspaceId.trim() : "";
  if (!workspaceId || workspaceId.length > 128) throw new RequestError(400, "A valid Idea Workspace document ID is required.");
  if (!isReportType(value.reportType)) throw new RequestError(400, "Unsupported VC Readiness Report type.");
  if (value.reportType !== "Basic SWOT Report") throw new RequestError(403, "The pilot includes one Basic VC Readiness Report only.");

  return {
    requestId,
    workspaceId,
    reportType: value.reportType,
    ...(value.prototypeWorkspace === undefined ? {} : { prototypeWorkspace: parsePrototypeWorkspace(value.prototypeWorkspace) })
  };
}

function enforceRateLimit(identity: string) {
  const now = Date.now();
  const existing = runtimeState.rateBuckets.get(identity);
  if (!existing || now - existing.startedAt >= RATE_LIMIT_WINDOW_MS) {
    runtimeState.rateBuckets.set(identity, { startedAt: now, count: 1 });
    return;
  }
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new RequestError(429, "Too many report requests. Please wait before trying again.");
  }
  existing.count += 1;
}

function requestIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local-development";
}

function currentUsageMonth() {
  return new Date().toISOString().slice(0, 7);
}

function providerErrorResponse(error: AIProviderError) {
  const statusByCode: Record<AIProviderError["code"], number> = {
    NOT_CONFIGURED: 503,
    AUTHENTICATION: 503,
    TIMEOUT: 504,
    RATE_LIMIT: 429,
    QUOTA: 429,
    REFUSAL: 422,
    INVALID_OUTPUT: 502,
    PROVIDER_ERROR: 502
  };
  return NextResponse.json({ error: error.message, code: error.code }, { status: statusByCode[error.code] });
}

function persistenceError(message?: string) {
  const value = message?.toLowerCase() ?? "";
  if (value.includes("limit") || value.includes("not included") || value.includes("already used")) {
    return new RequestError(403, "The report allowance for this plan has been reached.");
  }
  if (value.includes("workspace") || value.includes("complete")) {
    return new RequestError(409, "The Idea Workspace is no longer eligible for this report.");
  }
  return new RequestError(500, "The report was generated but could not be saved. Apply the current Supabase report migration and try again; no report credit was consumed.");
}

export async function POST(request: Request) {
  try {
    const body = await parseRequest(request);

    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV !== "development" || !isDemoDataEnabled()) {
        throw new RequestError(503, "Supabase authentication is required for report generation.");
      }
      if (!body.prototypeWorkspace) throw new RequestError(400, "Prototype workspace data is required in development mode.");

      const completion = completionPercent(body.prototypeWorkspace.sections, body.prototypeWorkspace.template);
      if (completion < 100) throw new RequestError(409, "Complete every required Idea Workspace section before generating a report.");

      const plan: SubscriptionPlan = "Free";
      const prototypeProfile: Profile = {
        id: "prototype-founder",
        full_name: "Prototype Founder",
        email: "prototype@venture-connect.local",
        role: "Founder",
        plan,
        free_report_used: false,
        reports_used_this_month: 0
      };
      const allowed = canGenerateReport(prototypeProfile, body.reportType);
      if (!allowed.allowed) throw new RequestError(403, allowed.reason ?? "This report is not available on the selected development plan.");

      const identity = `prototype:${requestIdentity(request)}`;
      enforceRateLimit(identity);
      const inFlightKey = `${identity}:${body.requestId}`;
      if (runtimeState.inFlight.has(inFlightKey)) throw new RequestError(409, "This report is already being generated.");
      runtimeState.inFlight.add(inFlightKey);
      try {
        const provider = getAIProvider();
        const report = await provider.generateReport({
          workspaceName: body.prototypeWorkspace.name,
          template: body.prototypeWorkspace.template,
          sections: body.prototypeWorkspace.sections,
          reportType: body.reportType,
          completionPercentage: completion
        });
        return NextResponse.json({
          report,
          provider: provider.name,
          model: provider.model,
          mode: provider.name === "mock" ? "development-mock" : "development-openai",
          persistence: "temporary",
          notice: "Supabase persistence is unavailable; this report is temporary and no report credit was consumed."
        });
      } finally {
        runtimeState.inFlight.delete(inFlightKey);
      }
    }

    if (body.prototypeWorkspace) {
      throw new RequestError(400, "Prototype report fields are disabled when Supabase is configured.");
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.workspaceId)) {
      throw new RequestError(400, "A valid Supabase Idea Workspace ID is required.");
    }

    const { authUserId, profile, supabase } = await requireRole(["founder"]);
    const [{ data: subscription, error: subscriptionError }, { data: workspace, error: workspaceError }] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", authUserId).order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from("idea_workspaces")
        .select("id, founder_id, title, template_type, sections_json, completion_percentage, status, archived")
        .eq("id", body.workspaceId)
        .eq("founder_id", authUserId)
        .maybeSingle()
    ]);

    if (subscriptionError) throw new RequestError(500, "Could not load report allowance.");
    if (workspaceError || !workspace || workspace.archived) throw new RequestError(404, "Idea Workspace document not found.");

    const template = workspace.template_type as WorkspaceTemplate;
    if (!WORKSPACE_TEMPLATES.includes(template)) throw new RequestError(409, "The Idea Workspace template is invalid.");
    if (template !== "startup") throw new RequestError(409, "The pilot report requires the Startup Template.");
    const sections = sanitizeSections(workspace.sections_json);
    const completion = completionPercent(sections, template);
    if (completion < 100 || Number(workspace.completion_percentage ?? 0) < 100) {
      throw new RequestError(409, "Complete every required Idea Workspace section before generating a report.");
    }

    const plan = normalizeSubscriptionPlan(profile.plan);
    const usageMonth = typeof subscription?.report_usage_month === "string" ? subscription.report_usage_month.slice(0, 7) : "";
    const reportsUsed = usageMonth && usageMonth !== currentUsageMonth() ? 0 : Number(subscription?.report_count_used ?? 0);
    const typedProfile: Profile = {
      id: profile.id,
      user_id: authUserId,
      full_name: profile.full_name ?? "Founder",
      company_name: profile.company_name ?? undefined,
      email: profile.email ?? "",
      role: "Founder",
      plan,
      free_report_used: Boolean(subscription?.free_swot_used),
      reports_used_this_month: reportsUsed,
      reports_month_reset: usageMonth ? `${usageMonth}-01T00:00:00.000Z` : undefined
    };
    const allowed = canGenerateReport(typedProfile, body.reportType);
    if (!allowed.allowed) throw new RequestError(403, allowed.reason ?? "This report is not available on the current plan.");

    const identity = `user:${authUserId}`;
    enforceRateLimit(identity);
    const inFlightKey = `${identity}:${body.requestId}`;
    if (runtimeState.inFlight.has(inFlightKey)) throw new RequestError(409, "This report is already being generated.");
    runtimeState.inFlight.add(inFlightKey);

    try {
      const provider = getAIProvider();
      if (provider.name === "mock" && !isDemoDataEnabled()) {
        throw new RequestError(503, "An AI provider must be configured before generating reports.");
      }
      if (provider.name === "mock") {
        const report = await provider.generateReport({
          workspaceName: workspace.title,
          template,
          sections,
          reportType: body.reportType,
          completionPercentage: completion
        });
        return NextResponse.json({
          report,
          provider: provider.name,
          model: provider.model,
          mode: "mock-fallback",
          persistence: "temporary",
          notice: "Development mock report. OPENAI_API_KEY is missing, so this report was not saved and no report credit was consumed."
        });
      }

      const { data: claim, error: claimError } = await supabase.rpc("begin_vc_report_generation", {
        p_request_id: body.requestId,
        p_workspace_id: body.workspaceId,
        p_report_type: body.reportType
      });
      if (claimError || !claim || typeof claim !== "object") {
        throw new RequestError(500, "Apply the OpenAI VC Readiness Report migration before generating real reports.");
      }

      const claimState = String((claim as { state?: unknown }).state ?? "");
      const existingReportId = (claim as { report_id?: unknown }).report_id;
      if (claimState === "pending") {
        throw new RequestError(409, "This report request is already being generated.");
      }
      if (claimState === "completed" && typeof existingReportId === "string") {
        const { data: existingReport, error: existingError } = await supabase
          .from("vc_reports")
          .select("*")
          .eq("id", existingReportId)
          .eq("founder_id", authUserId)
          .maybeSingle();
        if (existingError || !existingReport || !isStoredVcReportContent(existingReport.report_content)) {
          throw new RequestError(500, "The completed report could not be loaded.");
        }
        return NextResponse.json({
          report: existingReport.report_content,
          savedReport: existingReport,
          provider: existingReport.provider ?? "openai",
          model: existingReport.model ?? provider.model,
          mode: "supabase",
          persistence: "permanent",
          duplicate: true
        });
      }
      if (claimState !== "ready") {
        throw new RequestError(500, "The report request could not be reserved.");
      }

      try {
        const report = await provider.generateReport({
          workspaceName: workspace.title,
          template,
          sections,
          reportType: body.reportType,
          completionPercentage: completion
        });
        const { data: savedReport, error: saveError } = await supabase.rpc("record_vc_report", {
          p_request_id: body.requestId,
          p_workspace_id: body.workspaceId,
          p_report_type: body.reportType,
          p_provider: provider.name,
          p_model: provider.model,
          p_report_content: report,
          p_score: report.overallScore
        });
        if (saveError || !savedReport) throw persistenceError(saveError?.message);

        await supabase.from("pilot_events").insert({
          profile_id: profile.id,
          event_name: "readiness_report_generated",
          metadata: { workspaceId: body.workspaceId, reportType: body.reportType }
        });

        return NextResponse.json({
          report,
          savedReport,
          provider: provider.name,
          model: provider.model,
          mode: "supabase",
          persistence: "permanent"
        });
      } catch (error) {
        await supabase.rpc("fail_vc_report_generation", {
          p_request_id: body.requestId,
          p_error_code: error instanceof AIProviderError ? error.code : "PERSISTENCE_ERROR"
        });
        throw error;
      }
    } finally {
      runtimeState.inFlight.delete(inFlightKey);
    }
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof AIProviderError) return providerErrorResponse(error);
    return NextResponse.json({ error: "VC Readiness Report generation failed." }, { status: 500 });
  }
}

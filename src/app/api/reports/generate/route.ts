import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/aiProvider";
import { canGenerateReport } from "@/lib/subscription/plans";
import { createServiceClient, getAuthUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { auditLog } from "@/lib/notifications/service";
import type { Profile, ReportType, WorkspaceTemplate } from "@/lib/types";

type ReportRequest = {
  workspaceId?: string;
  workspaceName?: string;
  template?: WorkspaceTemplate;
  sections?: Record<string, string>;
  reportType?: ReportType;
};

const prototypeProfile: Profile = {
  id: "prototype-founder",
  full_name: "Prototype Founder",
  email: "prototype@venture-connect.local",
  role: "Founder",
  plan: "Founder Pro",
  free_report_used: false,
  reports_used_this_month: 0
};

async function generate(body: ReportRequest, profile: Profile) {
  const reportType = body.reportType ?? "Basic SWOT Report";
  const check = canGenerateReport(profile, reportType);
  if (!check.allowed) return { error: check.reason, status: 403 as const };

  const provider = getAIProvider();
  const report = await provider.generateReport({
    workspaceName: body.workspaceName ?? "Startup",
    template: body.template ?? "startup",
    sections: body.sections ?? {},
    reportType
  });

  return { report, provider: provider.name, status: 200 as const };
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReportRequest;

  if (!isSupabaseConfigured()) {
    const result = await generate(body, prototypeProfile);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ report: result.report, provider: result.provider, mode: "mock-fallback" });
  }

  const user = await getAuthUser();
  if (!user) {
    const result = await generate(body, prototypeProfile);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ report: result.report, provider: result.provider, mode: "mock-fallback" });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    const result = await generate(body, prototypeProfile);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ report: result.report, provider: result.provider, mode: "mock-fallback" });
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const normalizedPlan =
    subscription?.plan === "Student Pro" || profile.plan === "Student Pro"
      ? "Student Pro"
      : subscription?.plan === "Founder Pro" || profile.plan === "Founder Pro"
        ? "Founder Pro"
        : "Free";

  const typedProfile: Profile = {
    id: profile.id,
    user_id: profile.user_id ?? user.id,
    full_name: profile.full_name ?? "Founder",
    company_name: profile.company_name ?? undefined,
    email: profile.email ?? user.email ?? "",
    phone: profile.phone ?? undefined,
    role: profile.role ?? "Founder",
    plan: normalizedPlan,
    trust_score: profile.trust_score ?? 0,
    verification_status: profile.verification_status === "verified" ? "Verified" : "Pending",
    free_report_used: subscription?.free_swot_used ?? false,
    reports_used_this_month: subscription?.report_count_used ?? 0,
    opportunity_submissions_used: subscription?.opportunity_submissions_used ?? 0
  };
  let workspace: { id: string; title: string; template_type: WorkspaceTemplate; sections_json: Record<string, string> };

  if (body.workspaceId) {
    const { data, error } = await supabase
      .from("idea_workspaces")
      .select("id, title, template_type, sections_json, founder_id")
      .eq("id", body.workspaceId)
      .single();

    if (error || !data || data.founder_id !== user.id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    workspace = data as typeof workspace;
  } else {
    workspace = {
      id: "local",
      title: body.workspaceName ?? "Startup",
      template_type: body.template ?? "startup",
      sections_json: body.sections ?? {}
    };
  }

  const result = await generate(
    {
      workspaceName: workspace.title,
      template: workspace.template_type,
      sections: workspace.sections_json,
      reportType: body.reportType
    },
    typedProfile
  );

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { data: saved } = await supabase
    .from("vc_reports")
    .insert({
      founder_id: user.id,
      idea_workspace_id: workspace.id !== "local" ? workspace.id : null,
      report_type: result.report.reportType,
      plan_required: result.report.planRequired,
      report_content: result.report,
      score: result.report.overallScore
    })
    .select()
    .single();

  if (subscription) {
    if (result.report.reportType === "Basic SWOT Report") {
      await supabase.from("subscriptions").update({ free_swot_used: true }).eq("id", subscription.id);
    } else {
      await supabase
        .from("subscriptions")
        .update({ report_count_used: (subscription.report_count_used ?? 0) + 1 })
        .eq("id", subscription.id);
    }
  }
  if (saved) await auditLog(user.id, "report_generated", "vc_reports", saved.id, { reportType: result.report.reportType });

  return NextResponse.json({ report: result.report, savedReport: saved, provider: result.provider });
}

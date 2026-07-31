import { NextResponse } from "next/server";
import { ideaWorkspaces, aiReport } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { generateTemplateAwareReport } from "@/lib/report-generator";

export async function GET() {
  const demoEnabled = isDemoDataEnabled();
  return NextResponse.json({
    workspaces: demoEnabled ? ideaWorkspaces : [],
    meta: { source: demoEnabled ? "explicit-demo" : "database-required" }
  });
}

export async function POST(request: Request) {
  if (!isDemoDataEnabled()) {
    return NextResponse.json({ error: "Workspace report generation requires an authenticated backend." }, { status: 503 });
  }
  const body = await request.json();
  const { workspaceId, plan = "Free" } = body as { workspaceId?: string; plan?: string };
  const workspace = ideaWorkspaces.find((w) => w.id === workspaceId) ?? ideaWorkspaces[0];
  const report = generateTemplateAwareReport(workspace, aiReport);

  if (plan !== "Student Pro" && plan !== "Founder Pro") {
    return NextResponse.json({
      workspace,
      report: {
        overallScore: report.overallScore,
        startupScore: report.startupScore,
        readiness: report.readiness,
        swot: report.swot,
        nextSteps: report.nextSteps.slice(0, 4)
      },
      premiumPreview: true
    });
  }

  return NextResponse.json({ workspace, report });
}

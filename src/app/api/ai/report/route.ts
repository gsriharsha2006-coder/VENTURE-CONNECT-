import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  const body = await request.json();
  const provider = getAIProvider();

  const report = await provider.generateReport({
    workspaceName: body.startupName ?? body.workspaceName ?? "Startup",
    template: body.template ?? "startup",
    sections: body.sections ?? {},
    reportType: body.reportType ?? (body.tier === "premium" ? "Premium SWOT Analysis" : "Basic SWOT Report")
  });

  return NextResponse.json({
    data: report,
    meta: { generatedBy: provider.name, reportType: "vc_readiness" }
  });
}

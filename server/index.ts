import express from "express";
import cors from "cors";
import { ideaWorkspaces, aiReport, opportunities, blogPosts } from "../src/lib/data";
import { generateTemplateAwareReport } from "../src/lib/report-generator";

const app = express();
const PORT = process.env.API_PORT ?? 4000;

app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "venture-connect-api" });
});

app.get("/api/workspaces", (_req, res) => {
  res.json({ workspaces: ideaWorkspaces });
});

app.get("/api/workspaces/:id", (req, res) => {
  const workspace = ideaWorkspaces.find((w) => w.id === req.params.id);
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  res.json({ workspace });
});

app.post("/api/reports/generate", (req, res) => {
  const { workspaceId, plan = "Free" } = req.body as { workspaceId?: string; plan?: string };
  const workspace = ideaWorkspaces.find((w) => w.id === workspaceId) ?? ideaWorkspaces[0];
  const report = generateTemplateAwareReport(workspace, aiReport);
  const isPremium = plan === "Premium";

  res.json({
    workspaceId: workspace.id,
    template: workspace.template,
    plan,
    report: isPremium
      ? report
      : {
          overallScore: report.overallScore,
          startupScore: report.startupScore,
          readiness: report.readiness,
          swot: report.swot,
          nextSteps: report.nextSteps.slice(0, 4),
          lockedSections: ["Market Analysis", "Competitor Analysis", "Investment Recommendation"]
        }
  });
});

app.get("/api/opportunities", (_req, res) => {
  res.json({ opportunities });
});

app.get("/api/blogs", (_req, res) => {
  res.json({ blogs: blogPosts });
});

app.listen(PORT, () => {
  console.log(`Venture Connect API listening on http://localhost:${PORT}`);
});

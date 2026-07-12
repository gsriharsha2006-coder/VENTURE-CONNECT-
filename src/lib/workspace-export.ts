import { getTemplateDef } from "@/lib/templates";
import type { IdeaWorkspaceItem } from "@/lib/types";
import { workspaceToMarkdown } from "@/lib/report-generator";
import { downloadReportPdf } from "@/lib/pdf";

export function exportWorkspacePdf(workspace: IdeaWorkspaceItem) {
  const def = getTemplateDef(workspace.template);
  const sections = def.sections
    .filter((s) => (workspace.sections[s.key]?.trim().length ?? 0) > 0)
    .map((s) => ({
      title: s.label,
      lines: workspace.sections[s.key].split(/\n+/).filter(Boolean)
    }));

  downloadReportPdf({
    filename: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}-workspace.pdf`,
    title: workspace.name,
    subtitle: `${def.label} · Idea Workspace Export`,
    sections,
    scores: [
      { label: "Completion", value: Math.min(100, Object.values(workspace.sections).filter((v) => v.trim()).length * 8) },
      { label: "Uniqueness", value: workspace.uniqueness },
      { label: "Demand", value: workspace.demand },
      { label: "Scalability", value: workspace.scalability }
    ]
  });
}

/** Minimal DOCX via Word-compatible HTML blob */
export function exportWorkspaceDocx(workspace: IdeaWorkspaceItem) {
  const def = getTemplateDef(workspace.template);
  const body = def.sections
    .map(
      (s) =>
        `<h2>${s.label}</h2><p>${(workspace.sections[s.key] ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${workspace.name}</title></head><body><h1>${workspace.name}</h1><p><em>${def.label} workspace</em></p>${body}</body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${workspace.name.replace(/\s+/g, "-").toLowerCase()}-workspace.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportWorkspaceMarkdown(workspace: IdeaWorkspaceItem) {
  const md = workspaceToMarkdown(workspace);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

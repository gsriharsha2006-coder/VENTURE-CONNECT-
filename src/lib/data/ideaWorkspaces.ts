import { ideaWorkspaces as mockIdeaWorkspaces } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId } from "@/lib/data/shared";
import { completionPercent, emptySectionsForTemplate, getTemplateDef } from "@/lib/templates";
import type { IdeaStatus, IdeaWorkspaceItem, WorkspaceTemplate } from "@/lib/types";

function normalizeStatus(status?: string | null): IdeaStatus {
  if (status === "Complete" || status?.toLowerCase() === "complete") return "Complete";
  if (status === "In Progress" || status?.toLowerCase() === "in progress") return "In Progress";
  return "Draft";
}

function normalizeTemplate(template?: string | null): WorkspaceTemplate {
  const value = template as WorkspaceTemplate | undefined;
  return value && ["startup", "ai-project", "hackathon", "saas", "marketing", "student-project", "custom"].includes(value)
    ? value
    : "startup";
}

function workspaceFromRow(row: {
  id: string;
  founder_id: string | null;
  template_type: string | null;
  title: string | null;
  sections_json: unknown;
  video_link: string | null;
  completion_percentage: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}): IdeaWorkspaceItem {
  const template = normalizeTemplate(row.template_type);
  const def = getTemplateDef(template);
  const sections = {
    ...emptySectionsForTemplate(template),
    ...((row.sections_json && typeof row.sections_json === "object" && !Array.isArray(row.sections_json)
      ? row.sections_json
      : {}) as Record<string, string>)
  };
  const updated = row.updated_at ? new Date(row.updated_at).toLocaleString() : "Supabase";

  return {
    id: row.id,
    founder_id: row.founder_id ?? undefined,
    name: row.title ?? "Untitled workspace",
    title: row.title ?? "Untitled workspace",
    template,
    status: normalizeStatus(row.status),
    stage: "Idea",
    visibility: "application_only",
    tags: [],
    category: def.label,
    updatedAt: updated,
    created_at: row.created_at ?? undefined,
    sections,
    video_link: row.video_link ?? undefined,
    uploads: [],
    versionHistory: [
      {
        id: `version-${row.id}`,
        versionNumber: 1,
        sections,
        createdAt: row.created_at ?? new Date().toISOString(),
        summary: "Supabase workspace snapshot"
      }
    ],
    archived: false,
    summary: def.description,
    markdown: "",
    uniqueness: row.completion_percentage ?? completionPercent(sections, template),
    demand: row.completion_percentage ?? completionPercent(sections, template),
    scalability: row.completion_percentage ?? completionPercent(sections, template),
    competition: "Medium",
    versions: 1
  };
}

function workspaceToInsert(workspace: IdeaWorkspaceItem, founderId: string) {
  return {
    founder_id: founderId,
    template_type: workspace.template,
    title: workspace.name,
    sections_json: workspace.sections,
    video_link: workspace.video_link ?? null,
    completion_percentage: completionPercent(workspace.sections, workspace.template),
    status: workspace.status.toLowerCase(),
    updated_at: new Date().toISOString()
  };
}

export async function getIdeaWorkspaces(): Promise<IdeaWorkspaceItem[]> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return mockIdeaWorkspaces;

  const { data, error } = await supabase
    .from("idea_workspaces")
    .select("*")
    .eq("founder_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) return mockIdeaWorkspaces;
  return data.map(workspaceFromRow);
}

export async function createIdeaWorkspace(workspace: IdeaWorkspaceItem): Promise<IdeaWorkspaceItem> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return workspace;

  const { data, error } = await supabase
    .from("idea_workspaces")
    .insert(workspaceToInsert(workspace, userId))
    .select()
    .single();

  if (error || !data) return workspace;
  return workspaceFromRow(data);
}

export async function updateIdeaWorkspace(workspace: IdeaWorkspaceItem): Promise<IdeaWorkspaceItem> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return workspace;

  const { data, error } = await supabase
    .from("idea_workspaces")
    .update(workspaceToInsert(workspace, userId))
    .eq("id", workspace.id)
    .eq("founder_id", userId)
    .select()
    .single();

  if (error || !data) return workspace;
  return workspaceFromRow(data);
}


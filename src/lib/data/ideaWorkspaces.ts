import { ideaWorkspaces as mockIdeaWorkspaces } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";
import { completionPercent, emptySectionsForTemplate, getTemplateDef } from "@/lib/templates";
import type { IdeaStatus, IdeaWorkspaceItem, StartupStage, WorkspaceTemplate, WorkspaceVisibility } from "@/lib/types";

function normalizeStatus(status?: string | null): IdeaStatus {
  if (status === "Complete" || status?.toLowerCase() === "complete") return "Complete";
  if (status === "In Progress" || ["in progress", "in_progress"].includes(status?.toLowerCase() ?? "")) return "In Progress";
  return "Draft";
}

function normalizeTemplate(template?: string | null): WorkspaceTemplate {
  const value = template as WorkspaceTemplate | undefined;
  return value && ["startup", "ai-project", "hackathon", "saas", "marketing", "student-project", "custom"].includes(value)
    ? value
    : "startup";
}

function normalizeStage(stage?: string | null): StartupStage {
  return ["Idea", "Prototype", "MVP", "Revenue", "Seed"].includes(stage ?? "") ? stage as StartupStage : "Idea";
}

function normalizeVisibility(visibility?: string | null): WorkspaceVisibility {
  return visibility === "private" ? "private" : "application_only";
}

function workspaceFromRow(row: {
  id: string;
  founder_id: string | null;
  template_type: string | null;
  title: string | null;
  sections_json: unknown;
  video_link: string | null;
  stage: string | null;
  visibility: string | null;
  tags: string[] | null;
  completion_percentage: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean | null;
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
    stage: normalizeStage(row.stage),
    visibility: normalizeVisibility(row.visibility),
    tags: row.tags ?? [],
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
    archived: row.archived ?? false,
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
    stage: workspace.stage,
    visibility: workspace.visibility,
    tags: workspace.tags,
    completion_percentage: completionPercent(workspace.sections, workspace.template),
    status: workspace.status.toLowerCase().replace(" ", "_"),
    archived: workspace.archived,
    updated_at: new Date().toISOString()
  };
}

export async function getIdeaWorkspaces(): Promise<IdeaWorkspaceItem[]> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("list Idea Workspace documents");
  if (!supabase || !userId) return mockIdeaWorkspaces;

  const { data, error } = await supabase
    .from("idea_workspaces")
    .select("*")
    .eq("founder_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw supabaseDataError("list Idea Workspace documents", error);
  return (data ?? []).map(workspaceFromRow);
}

export async function createIdeaWorkspace(workspace: IdeaWorkspaceItem): Promise<IdeaWorkspaceItem> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("create Idea Workspace document");
  if (!supabase || !userId) return workspace;

  const { data, error } = await supabase
    .from("idea_workspaces")
    .insert(workspaceToInsert(workspace, userId))
    .select()
    .single();

  if (error || !data) throw supabaseDataError("create Idea Workspace document", error ?? "No row returned.");
  return workspaceFromRow(data);
}

export async function updateIdeaWorkspace(workspace: IdeaWorkspaceItem): Promise<IdeaWorkspaceItem> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("update Idea Workspace document");
  if (!supabase || !userId) return workspace;

  const { data, error } = await supabase
    .from("idea_workspaces")
    .update(workspaceToInsert(workspace, userId))
    .eq("id", workspace.id)
    .eq("founder_id", userId)
    .select()
    .single();

  if (error || !data) throw supabaseDataError("update Idea Workspace document", error ?? "No row returned.");
  return workspaceFromRow(data);
}

export async function archiveIdeaWorkspace(workspaceId: string) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("archive Idea Workspace document");
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from("idea_workspaces")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .eq("founder_id", userId);
  if (error) throw supabaseDataError("archive Idea Workspace document", error);
}

export async function deleteIdeaWorkspace(workspaceId: string) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("delete Idea Workspace document");
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from("idea_workspaces")
    .delete()
    .eq("id", workspaceId)
    .eq("founder_id", userId);
  if (error) throw supabaseDataError("delete Idea Workspace document", error);
}

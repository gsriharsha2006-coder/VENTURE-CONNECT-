"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Archive,
  Copy,
  Download,
  FileText,
  FolderOpen,
  ImagePlus,
  LayoutTemplate,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDemoPlan } from "@/hooks/useDemoPlan";
import {
  archiveIdeaWorkspace,
  createIdeaWorkspace,
  deleteIdeaWorkspace,
  getIdeaWorkspaces,
  updateIdeaWorkspace
} from "@/lib/data/ideaWorkspaces";
import { ideaWorkspaces as seedWorkspaces } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { PLAN_LIMITS } from "@/lib/subscription/plans";
import { completionPercent, getTemplateDef, WORKSPACE_TEMPLATES } from "@/lib/templates";
import { exportWorkspaceDocx, exportWorkspaceMarkdown, exportWorkspacePdf } from "@/lib/workspace-export";
import type { IdeaStatus, IdeaWorkspaceItem, StartupStage, WorkspaceTemplate } from "@/lib/types";

const STORAGE_KEY = "venture-connect-idea-workspace";
const statuses: IdeaStatus[] = ["Draft", "In Progress", "Complete"];
const stages: StartupStage[] = ["Idea", "Prototype", "MVP", "Revenue", "Seed"];

const versionDateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata"
});

function createBlankWorkspace(template: WorkspaceTemplate = "startup"): IdeaWorkspaceItem {
  const def = getTemplateDef(template);
  const sections = Object.fromEntries(def.sections.map((s) => [s.key, ""]));
  return {
    id: `ws-${Date.now()}`,
    name: "Untitled workspace",
    template,
    status: "Draft",
    stage: "Idea",
    visibility: "application_only",
    tags: [],
    category: def.label,
    updatedAt: "Autosaved now",
    sections,
    uploads: [],
    versionHistory: [{ id: `v-${Date.now()}`, versionNumber: 1, sections: { ...sections }, createdAt: new Date().toISOString() }],
    archived: false,
    summary: def.description,
    markdown: "",
    uniqueness: 62,
    demand: 65,
    scalability: 68,
    competition: "Medium",
    versions: 1
  };
}

export default function IdeaWorkspacePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<IdeaWorkspaceItem[]>(seedWorkspaces);
  const [selectedId, setSelectedId] = useState(seedWorkspaces[0]?.id ?? "");
  const [activeSection, setActiveSection] = useState<string>("");
  const [autosave, setAutosave] = useState("Autosave ready.");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [plan, setPlan] = useDemoPlan();
  const [persistenceError, setPersistenceError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadWorkspaces() {
      if (isSupabaseConfigured()) {
        try {
          const remote = await getIdeaWorkspaces();
          if (mounted) {
            setWorkspaces(remote);
            setSelectedId(remote[0]?.id ?? "");
            setPersistenceError("");
          }
        } catch (error) {
          if (mounted) {
            setWorkspaces([]);
            setSelectedId("");
            setPersistenceError(error instanceof Error ? error.message : "Unable to load Idea Workspace documents from Supabase.");
          }
        }
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as IdeaWorkspaceItem[];
          if (mounted && parsed.length) {
            setWorkspaces(parsed);
            setSelectedId(parsed[0].id);
          }
        } catch {
          /* use seed */
        }
      }
    }

    void loadWorkspaces();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
      setAutosave(`Autosaved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [workspaces]);

  const selected = useMemo(
    () => workspaces.find((w) => w.id === selectedId) ?? workspaces[0],
    [workspaces, selectedId]
  );

  const templateDef = useMemo(() => getTemplateDef(selected?.template ?? "startup"), [selected?.template]);

  useEffect(() => {
    if (selected && !activeSection) {
      setActiveSection(templateDef.sections[0]?.key ?? "");
    }
  }, [selected, templateDef, activeSection]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return workspaces.filter(
      (w) =>
        !w.archived &&
        (w.name.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)) ||
          w.category.toLowerCase().includes(q))
    );
  }, [workspaces, searchQuery]);

  const completion = selected ? completionPercent(selected.sections, selected.template) : 0;

  const updateSelected = useCallback(
    (patch: Partial<IdeaWorkspaceItem>) => {
      if (!selected) return;
      const nextWorkspace = { ...selected, ...patch, updatedAt: "Just now", markdown: patch.markdown ?? selected.markdown };
      setWorkspaces((current) =>
        current.map((w) =>
          w.id === selected.id
            ? nextWorkspace
            : w
        )
      );
      if (isSupabaseConfigured() && !selected.id.startsWith("workspace-") && !selected.id.startsWith("ws-")) {
        void updateIdeaWorkspace(nextWorkspace)
          .then(() => setPersistenceError(""))
          .catch((error) => setPersistenceError(error instanceof Error ? error.message : "Unable to save this document to Supabase."));
      }
    },
    [selected]
  );

  function updateSection(key: string, value: string) {
    if (!selected) return;
    const sections = { ...selected.sections, [key]: value };
    updateSelected({ sections });
  }

  function saveVersion() {
    if (!selected) return;
    const nextVersion = selected.versions + 1;
    const version = {
      id: `v-${Date.now()}`,
      versionNumber: nextVersion,
      sections: { ...selected.sections },
      createdAt: new Date().toISOString(),
      summary: `Version ${nextVersion} snapshot`
    };
    updateSelected({
      versions: nextVersion,
      versionHistory: [...selected.versionHistory, version]
    });
  }

  function duplicateWorkspace() {
    if (!selected) return;
    const copy = {
      ...selected,
      id: `ws-${Date.now()}`,
      name: `${selected.name} (copy)`,
      status: "Draft" as IdeaStatus,
      versionHistory: selected.versionHistory.map((v) => ({ ...v, id: `v-${Date.now()}-${v.versionNumber}` }))
    };
    setWorkspaces((w) => [copy, ...w]);
    setSelectedId(copy.id);
    if (isSupabaseConfigured()) {
      void createIdeaWorkspace(copy).then((saved) => {
        setWorkspaces((current) => current.map((item) => item.id === copy.id ? saved : item));
        setSelectedId(saved.id);
        setPersistenceError("");
      }).catch((error) => {
        setWorkspaces((current) => current.filter((item) => item.id !== copy.id));
        setSelectedId(selected.id);
        setPersistenceError(error instanceof Error ? error.message : "Unable to duplicate this document in Supabase.");
      });
    }
  }

  async function archiveWorkspace() {
    if (!selected) return;
    if (isSupabaseConfigured()) {
      try {
        await archiveIdeaWorkspace(selected.id);
        setPersistenceError("");
      } catch (error) {
        setPersistenceError(error instanceof Error ? error.message : "Unable to archive this document in Supabase.");
        return;
      }
    }
    setWorkspaces((current) => current.map((workspace) => workspace.id === selected.id ? { ...workspace, archived: true } : workspace));
    const remaining = workspaces.filter((w) => w.id !== selected.id && !w.archived);
    setSelectedId(remaining[0]?.id ?? "");
  }

  async function deleteWorkspace() {
    if (!selected) return;
    if (isSupabaseConfigured()) {
      try {
        await deleteIdeaWorkspace(selected.id);
        setPersistenceError("");
      } catch (error) {
        setPersistenceError(error instanceof Error ? error.message : "Unable to delete this document from Supabase.");
        return;
      }
    }
    const next = workspaces.filter((w) => w.id !== selected.id);
    if (isSupabaseConfigured()) {
      setWorkspaces(next);
      setSelectedId(next[0]?.id ?? "");
      return;
    }
    const fallback = createBlankWorkspace();
    setWorkspaces(next.length ? next : [fallback]);
    setSelectedId(next[0]?.id ?? fallback.id);
  }

  function createFromTemplate(template: WorkspaceTemplate) {
    const limits = PLAN_LIMITS[plan];
    if (!limits.allTemplates && template !== "startup") {
      setAutosave(`${getTemplateDef(template).label} requires Student Pro or Founder Pro.`);
      setShowTemplatePicker(false);
      return;
    }
    if (limits.workspacesLimit !== "unlimited" && workspaces.filter((item) => !item.archived).length >= limits.workspacesLimit) {
      setAutosave(`${plan} allows ${limits.workspacesLimit} Idea Workspace. Upgrade to create another document.`);
      setShowTemplatePicker(false);
      return;
    }
    const ws = createBlankWorkspace(template);
    setWorkspaces((w) => [ws, ...w]);
    setSelectedId(ws.id);
    setShowTemplatePicker(false);
    setActiveSection(getTemplateDef(template).sections[0].key);
    if (isSupabaseConfigured()) {
      void createIdeaWorkspace(ws).then((saved) => {
        setWorkspaces((current) => current.map((item) => (item.id === ws.id ? saved : item)));
        setSelectedId(saved.id);
        setPersistenceError("");
      }).catch((error) => {
        setWorkspaces((current) => current.filter((item) => item.id !== ws.id));
        setSelectedId("");
        setPersistenceError(error instanceof Error ? error.message : "Unable to create this document in Supabase.");
      });
    }
  }

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !selected) return;
    const names = Array.from(files).map((f) => f.name);
    updateSelected({ uploads: [...selected.uploads, ...names] });
  }

  function openVcReport() {
    window.localStorage.setItem("venture-connect-active-workspace", JSON.stringify(selected));
    router.push("/dashboard/vc-readiness");
  }

  function changeStatus(nextStatus: IdeaStatus) {
    if (!selected) return;
    if (nextStatus === "Complete" && completion < 100) {
      const missing = templateDef.sections
        .filter((section) => section.required !== false && !selected.sections[section.key]?.trim())
        .map((section) => section.label)
        .join(", ");
      setAutosave(`Cannot mark Complete. Missing: ${missing}.`);
      return;
    }
    updateSelected({ status: nextStatus });
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        {persistenceError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{persistenceError}</div>
        ) : null}
        <Card className="p-8 text-center">
          <Badge>Idea Workspace</Badge>
          <h1 className="mt-4 text-2xl font-semibold">No Idea Workspace documents yet</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Create your first Startup Template. When Supabase is configured, it will be saved to your authenticated founder account.
          </p>
          <Button className="mt-5" onClick={() => createFromTemplate("startup")}>
            <LayoutTemplate size={16} />
            Create first workspace
          </Button>
        </Card>
      </div>
    );
  }

  const sectionMeta = templateDef.sections.find((s) => s.key === activeSection);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center"
      >
        <div>
          <Badge>Idea Workspace</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
            Structured documents for investor-ready applications
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Create documents, fill required sections, autosave progress, export files, and generate VC Readiness Reports from selected workspaces.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Demo plan</span>
            <select
              aria-label="Demo subscription plan"
              value={plan}
              onChange={(event) => setPlan(event.target.value as "Free" | "Student Pro" | "Founder Pro")}
              className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              <option>Free</option>
              <option>Student Pro</option>
              <option>Founder Pro</option>
            </select>
          </label>
          <Button variant="secondary" onClick={() => setShowTemplatePicker(true)}>
            <LayoutTemplate size={16} />
            New workspace
          </Button>
          <Button onClick={openVcReport}>
            <Sparkles size={16} />
            VC Readiness Report
          </Button>
        </div>
      </motion.div>

      {persistenceError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{persistenceError}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="mt-4 space-y-2 scrollbar-thin max-h-[420px] overflow-y-auto">
            {filtered.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setSelectedId(w.id);
                  setActiveSection(getTemplateDef(w.template).sections[0].key);
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                  w.id === selectedId
                    ? "border-primary bg-blue-50 shadow-panel"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {getTemplateDef(w.template).label} / {w.status}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document title</span>
                <input
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                  className="mt-1 w-full bg-transparent text-2xl font-semibold outline-none"
                />
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Template type</p>
                  <div className="flex h-10 items-center">
                    <Badge>{getTemplateDef(selected.template).label}</Badge>
                  </div>
                </div>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select value={selected.status} onChange={(e) => changeStatus(e.target.value as IdeaStatus)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</span>
                  <select value={selected.stage} onChange={(e) => updateSelected({ stage: e.target.value as StartupStage })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                    {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</span>
                  <select value={selected.visibility} onChange={(e) => updateSelected({ visibility: e.target.value as "private" | "application_only" })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                    <option value="private">Private</option>
                    <option value="application_only">Application only</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Completion", completion],
                ["Uniqueness", selected.uniqueness],
                ["Demand", selected.demand],
                ["Scalability", selected.scalability]
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="mb-1 text-xs font-semibold text-slate-500">{label as string}</p>
                  <ProgressBar value={value as number} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">{autosave}</p>
            {completion < 100 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Complete your Idea Workspace document before applying to investor, incubator, hackathon, accelerator, or challenge posts.
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                This document is complete and eligible for structured opportunity applications.
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <Card className="p-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</p>
              <nav className="mt-2 space-y-1">
                {templateDef.sections.map((s) => {
                  const filled = (selected.sections[s.key]?.trim().length ?? 0) > 20;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setActiveSection(s.key)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        activeSection === s.key
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>{s.label}</span>
                      {filled && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  );
                })}
              </nav>
            </Card>

            <Card className="p-4">
              {sectionMeta ? (
                <>
                  <CardHeader
                    eyebrow={templateDef.label}
                    title={sectionMeta.label}
                  />
                  <p className="-mt-2 mb-4 text-xs leading-5 text-slate-500">Select a section to edit its content.</p>
                  <textarea
                    value={selected.sections[activeSection] ?? ""}
                    onChange={(e) => updateSection(activeSection, e.target.value)}
                    placeholder={sectionMeta.hint}
                    rows={14}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-6 outline-none focus:border-primary"
                  />
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Markdown preview</p>
                  <div className="prose prose-sm mt-2 max-w-none text-slate-700">
                    <ReactMarkdown>{selected.sections[activeSection] ?? ""}</ReactMarkdown>
                  </div>
                  {selected.template === "startup" && activeSection === "one_minute_video_link" && selected.sections.one_minute_video_link ? (
                    <a
                      href={selected.sections.one_minute_video_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-primary"
                    >
                      Open attached video link
                    </a>
                  ) : null}
                </div>
                </>
              ) : (
                <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Select a section to edit its content.
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <CardHeader title="Files, versions & exports" eyebrow="Workspace tools" />
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                <UploadCloud size={16} />
                Upload
                <input type="file" multiple className="hidden" onChange={handleUpload} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                <ImagePlus size={16} />
                Image
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              <Button variant="secondary" size="sm" onClick={saveVersion}>
                <Save size={14} />
                Save version
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportWorkspacePdf(selected)}>
                <Download size={14} />
                PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={plan === "Free"}
                title={plan === "Free" ? "DOCX export requires Student Pro or Founder Pro" : undefined}
                onClick={() => exportWorkspaceDocx(selected)}
              >
                <FileText size={14} />
                DOCX
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportWorkspaceMarkdown(selected)}>
                <Download size={14} />
                Markdown
              </Button>
              <Button variant="secondary" size="sm" onClick={duplicateWorkspace}>
                <Copy size={14} />
                Duplicate
              </Button>
              <Button variant="secondary" size="sm" onClick={archiveWorkspace}>
                <Archive size={14} />
                Archive
              </Button>
              <Button variant="secondary" size="sm" onClick={deleteWorkspace}>
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
            {selected.uploads.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selected.uploads.map((file) => (
                  <li key={file} className="flex items-center gap-2 text-sm text-slate-600">
                    <FolderOpen size={14} />
                    {file}
                  </li>
                ))}
              </ul>
            )}
            {selected.versionHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Version history</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {selected.versionHistory.slice(-5).reverse().map((v) => (
                    <li key={v.id}>
                      v{v.versionNumber} / {versionDateFormatter.format(new Date(v.createdAt))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                placeholder="Add tag..."
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    updateSelected({ tags: [...selected.tags, e.currentTarget.value.trim()] });
                    e.currentTarget.value = "";
                  }
                }}
              />
              {selected.tags.map((tag) => (
                <Badge key={tag} tone="slate">
                  <Tag size={12} className="mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showTemplatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => setShowTemplatePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-premium"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold">Choose a workspace template</h2>
              <p className="mt-2 text-sm text-slate-600">
                Each template changes the document structure and the required fields used for application eligibility.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {WORKSPACE_TEMPLATES.map((t) => {
                  const locked = plan === "Free" && t.id !== "startup";
                  return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => createFromTemplate(t.id)}
                    className={`rounded-lg border p-4 text-left transition hover:shadow-panel ${locked ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 hover:border-primary"}`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="font-semibold">{t.label}</p>
                      {locked ? <Badge tone="amber">Upgrade</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{t.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{t.sections.length} structured sections</p>
                  </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

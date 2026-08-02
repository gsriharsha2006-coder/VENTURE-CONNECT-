"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Archive, Download, FileChartColumn, FileText, LayoutTemplate, RotateCcw, Save, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  archiveIdeaWorkspace,
  createIdeaWorkspace,
  getIdeaWorkspaces,
  restoreIdeaWorkspace,
  updateIdeaWorkspace
} from "@/lib/data/ideaWorkspaces";
import { ideaWorkspaces as seedWorkspaces } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { completionPercent, emptySectionsForTemplate, getTemplateDef } from "@/lib/templates";
import { exportWorkspaceDocx, exportWorkspaceMarkdown, exportWorkspacePdf } from "@/lib/workspace-export";
import type { IdeaStatus, IdeaWorkspaceItem, StartupStage } from "@/lib/types";

const STORAGE_KEY = "venture-connect-pilot-startup-workspaces";
const statuses: IdeaStatus[] = ["Draft", "In Progress", "Complete"];
const stages: StartupStage[] = ["Idea", "Prototype", "MVP", "Revenue", "Seed"];

function createBlankWorkspace(): IdeaWorkspaceItem {
  const def = getTemplateDef("startup");
  const sections = emptySectionsForTemplate("startup");
  const now = new Date().toISOString();
  return {
    id: `ws-${Date.now()}`,
    name: "Untitled startup idea",
    template: "startup",
    status: "Draft",
    stage: "Idea",
    visibility: "application_only",
    tags: [],
    category: def.label,
    updatedAt: now,
    sections,
    uploads: [],
    versionHistory: [{ id: `v-${Date.now()}`, versionNumber: 1, sections: { ...sections }, createdAt: now }],
    archived: false,
    summary: def.description,
    markdown: "",
    uniqueness: 0,
    demand: 0,
    scalability: 0,
    competition: "Medium",
    versions: 1
  };
}

export default function IdeaWorkspacePage() {
  const router = useRouter();
  const demoEnabled = isDemoDataEnabled();
  const [workspaces, setWorkspaces] = useState<IdeaWorkspaceItem[]>(demoEnabled ? seedWorkspaces.map((item) => ({ ...item, template: "startup" })) : []);
  const [selectedId, setSelectedId] = useState("");
  const [activeSection, setActiveSection] = useState("basic_information");
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState("All changes saved.");
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const saveInFlight = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (isSupabaseConfigured()) {
          const rows = await getIdeaWorkspaces();
          if (!mounted) return;
          setWorkspaces(rows);
          setSelectedId(rows.find((item) => !item.archived)?.id ?? "");
          return;
        }
        if (!demoEnabled) {
          setError("Account data is unavailable because backend services are not configured.");
          return;
        }
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const rows = JSON.parse(stored) as IdeaWorkspaceItem[];
          if (mounted) {
            setWorkspaces(rows);
            setSelectedId(rows.find((item) => !item.archived)?.id ?? "");
          }
        }
      } catch (reason) {
        if (mounted) setError(reason instanceof Error ? reason.message : "Idea Workspace documents could not be loaded.");
      }
    }
    void load();
    return () => { mounted = false; };
  }, [demoEnabled]);

  useEffect(() => {
    if (isSupabaseConfigured() || !demoEnabled) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
      setSaveStatus(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [demoEnabled, workspaces]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!saveInFlight.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const selected = useMemo(() => workspaces.find((item) => item.id === selectedId), [selectedId, workspaces]);
  const template = getTemplateDef("startup");
  const active = useMemo(() => workspaces.filter((item) => !item.archived && item.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, workspaces]);
  const archived = useMemo(() => workspaces.filter((item) => item.archived), [workspaces]);
  const completion = selected ? completionPercent(selected.sections, "startup") : 0;
  const sectionMeta = template.sections.find((section) => section.key === activeSection);

  const persist = useCallback(async (workspace: IdeaWorkspaceItem) => {
    if (!isSupabaseConfigured() || workspace.id.startsWith("ws-")) return;
    saveInFlight.current = true;
    setSaveStatus("Saving changes...");
    try {
      await updateIdeaWorkspace(workspace);
      setSaveStatus(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This startup document could not be saved.");
      setSaveStatus("Changes need attention.");
    } finally {
      saveInFlight.current = false;
    }
  }, []);

  const updateSelected = useCallback((patch: Partial<IdeaWorkspaceItem>) => {
    if (!selected) return;
    const next = { ...selected, ...patch, updatedAt: new Date().toISOString(), template: "startup" as const };
    setWorkspaces((current) => current.map((item) => item.id === selected.id ? next : item));
    void persist(next);
  }, [persist, selected]);

  async function createStartupIdea() {
    if (!isSupabaseConfigured() && !demoEnabled) return;
    const draft = createBlankWorkspace();
    setWorkspaces((current) => [draft, ...current]);
    setSelectedId(draft.id);
    setActiveSection("basic_information");
    if (!isSupabaseConfigured()) return;
    try {
      const saved = await createIdeaWorkspace(draft);
      setWorkspaces((current) => current.map((item) => item.id === draft.id ? saved : item));
      setSelectedId(saved.id);
      setSaveStatus("Startup idea created and saved.");
    } catch (reason) {
      setWorkspaces((current) => current.filter((item) => item.id !== draft.id));
      setSelectedId("");
      setError(reason instanceof Error ? reason.message : "The startup idea could not be created.");
    }
  }

  async function archiveSelected() {
    if (!selected) return;
    try {
      await archiveIdeaWorkspace(selected.id);
      setWorkspaces((current) => current.map((item) => item.id === selected.id ? { ...item, archived: true } : item));
      setSelectedId(workspaces.find((item) => item.id !== selected.id && !item.archived)?.id ?? "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The startup idea could not be archived.");
    }
  }

  async function restoreArchived(id: string) {
    try {
      await restoreIdeaWorkspace(id);
      setWorkspaces((current) => current.map((item) => item.id === id ? { ...item, archived: false } : item));
      setSelectedId(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The startup idea could not be restored.");
    }
  }

  function saveVersion() {
    if (!selected) return;
    const number = selected.versions + 1;
    updateSelected({ versions: number, versionHistory: [...selected.versionHistory, { id: `v-${Date.now()}`, versionNumber: number, sections: { ...selected.sections }, createdAt: new Date().toISOString() }] });
  }

  function changeStatus(status: IdeaStatus) {
    if (!selected) return;
    if (status === "Complete" && completion < 100) {
      setError("Complete every required Startup Template section before marking this idea Complete.");
      return;
    }
    updateSelected({ status });
  }

  if (!selected) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Idea Workspace" title="Create your Startup Idea" description="Use one structured Startup Template for incubation applications and readiness review." />
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        <Card className="p-8 text-center">
          <LayoutTemplate className="mx-auto text-primary" size={28} />
          <h1 className="mt-4 text-2xl font-semibold">No active startup idea</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Create a private startup document or restore an archived one.</p>
          <Button className="mt-5" onClick={() => void createStartupIdea()} disabled={!isSupabaseConfigured() && !demoEnabled}>Create Startup Idea</Button>
        </Card>
        {archived.length ? <Card><CardHeader eyebrow="Archive" title="Archived startup ideas" /><div className="space-y-2">{archived.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3"><span className="text-sm font-semibold">{item.name}</span><Button size="sm" variant="secondary" onClick={() => void restoreArchived(item.id)}><RotateCcw size={14} />Restore</Button></div>)}</div></Card> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Idea Workspace"
        title="Open Startup Workspace"
        description="Document your startup honestly, save drafts automatically, and prepare one consistent source for incubation applications."
        actions={<><Button onClick={() => void createStartupIdea()}><LayoutTemplate size={16} />Create Startup Idea</Button><Button variant="secondary" onClick={() => router.push("/dashboard/vc-readiness")}><FileChartColumn size={16} />VC Readiness Report</Button></>}
      />
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="min-w-0 p-4 xl:sticky xl:top-24 xl:self-start">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Search size={16} className="text-slate-400" />
            <input aria-label="Search startup ideas" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search startup ideas" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="mt-4 space-y-2">
            {active.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setActiveSection("basic_information"); }} className={`w-full rounded-lg border p-3 text-left ${item.id === selected.id ? "border-primary bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">Startup Template / {item.status}</p></button>)}
          </div>
          {archived.length ? <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Archived</p>{archived.map((item) => <button key={item.id} type="button" onClick={() => void restoreArchived(item.id)} className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-200 p-2 text-left text-sm"><span className="truncate">{item.name}</span><RotateCcw size={14} /></button>)}</div> : null}
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document title</span><input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} className="mt-1 w-full bg-transparent text-2xl font-semibold outline-none" /></label>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Template</p><Badge>Startup Template</Badge></div>
              <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span><select value={selected.status} onChange={(event) => changeStatus(event.target.value as IdeaStatus)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</span><select value={selected.stage} onChange={(event) => updateSelected({ stage: event.target.value as StartupStage })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
            </div>
            <div className="mt-5"><div className="mb-2 flex justify-between text-sm font-semibold"><span>Completion</span><span>{completion}%</span></div><ProgressBar value={completion} /></div>
            <p role="status" className="mt-3 text-xs text-slate-500">{saveStatus}</p>
            {completion < 100 ? <StatusMessage className="mt-4">Complete your Idea Workspace document before applying to an incubation program.</StatusMessage> : <StatusMessage tone="success" className="mt-4">This Startup Template is complete and ready for incubation applications.</StatusMessage>}
          </Card>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[230px_minmax(0,1fr)]">
            <Card className="min-w-0 p-3 xl:sticky xl:top-24 xl:self-start">
              <p className="px-2 text-sm font-semibold text-slate-500">Sections</p>
              <nav aria-label="Startup Template sections" className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-1 xl:overflow-visible">
                {template.sections.map((section) => <button key={section.key} type="button" onClick={() => setActiveSection(section.key)} className={`min-h-10 shrink-0 rounded-lg px-3 py-2 text-left text-sm xl:w-full ${activeSection === section.key ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}>{section.label}</button>)}
              </nav>
            </Card>
            <Card className="min-w-0">
              {sectionMeta ? <><CardHeader eyebrow="Startup Template" title={sectionMeta.label} /><p className="text-sm leading-6 text-slate-600">{sectionMeta.hint}</p><ul className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">{sectionMeta.prompts.map((prompt) => <li key={prompt}>• {prompt}</li>)}</ul><textarea value={selected.sections[activeSection] ?? ""} onChange={(event) => updateSelected({ sections: { ...selected.sections, [activeSection]: event.target.value } })} placeholder="Write a clear, factual response. Honest zero or not-yet-validated answers are acceptable." rows={14} className="mt-4 min-h-[340px] w-full resize-y rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm leading-6 outline-none focus:border-primary focus:ring-4 focus:ring-blue-100" /></> : <p className="p-8 text-center text-sm text-slate-500">Select a section to edit its content.</p>}
            </Card>
          </div>

          {previewOpen ? <Card><CardHeader eyebrow="Preview" title={selected.name} /><div className="space-y-6">{template.sections.map((section) => <section key={section.key}><h2 className="text-base font-semibold">{section.label}</h2><div className="prose prose-sm mt-2 max-w-none text-slate-700"><ReactMarkdown>{selected.sections[section.key] || "Not completed."}</ReactMarkdown></div></section>)}</div></Card> : null}

          <Card>
            <CardHeader eyebrow="Workspace tools" title="Save, preview and export" />
            <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={saveVersion}><Save size={14} />Save version</Button><Button variant="secondary" size="sm" onClick={() => setPreviewOpen((value) => !value)}><FileText size={14} />{previewOpen ? "Close preview" : "Preview startup document"}</Button><Button variant="secondary" size="sm" onClick={() => exportWorkspacePdf(selected)}><Download size={14} />PDF</Button><Button variant="secondary" size="sm" onClick={() => exportWorkspaceDocx(selected)}><FileText size={14} />DOCX</Button><Button variant="secondary" size="sm" onClick={() => exportWorkspaceMarkdown(selected)}><Download size={14} />Markdown</Button><Button variant="secondary" size="sm" onClick={() => void archiveSelected()}><Archive size={14} />Archive idea</Button></div>
            {selected.versionHistory.length ? <p className="mt-4 text-xs text-slate-500">{selected.versionHistory.length} saved version{selected.versionHistory.length === 1 ? "" : "s"}. Latest changes are also autosaved.</p> : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

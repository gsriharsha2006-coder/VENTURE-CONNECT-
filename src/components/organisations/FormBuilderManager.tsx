"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";

type BuilderField = {
  fieldKey: string;
  label: string;
  fieldType: string;
  helpText?: string;
  required: boolean;
  configuration?: Record<string, unknown>;
};

type BuilderForm = {
  id: string;
  title: string;
  status: string;
  opportunityTitle: string;
  fields: BuilderField[];
};

const fieldTypes = ["short_text", "long_text", "email", "phone", "number", "url", "consent_checkbox", "team_members"];
const CUSTOM_FIELD_LIMIT = 5;

function keyFromLabel(label: string, index: number) {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field";
  return `custom_${base}_${index}`.slice(0, 63);
}

function isCustomField(field: BuilderField) {
  return field.configuration?.pilotCustom === true || field.fieldKey.startsWith("custom_");
}

export function FormBuilderManager({ initialForms }: { initialForms: BuilderForm[] }) {
  const [forms, setForms] = useState(initialForms);
  const [selectedId, setSelectedId] = useState(initialForms[0]?.id ?? "");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected = forms.find((form) => form.id === selectedId);

  function updateFields(fields: BuilderField[]) {
    setForms((current) => current.map((form) => form.id === selectedId ? { ...form, fields } : form));
  }

  function move(index: number, direction: -1 | 1) {
    if (!selected) return;
    const target = index + direction;
    if (target < 0 || target >= selected.fields.length) return;
    const next = [...selected.fields];
    [next[index], next[target]] = [next[target], next[index]];
    updateFields(next);
  }

  async function save(status: "draft" | "published" | "closed") {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/opportunity-forms/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, fields: selected.fields })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Form could not be saved.");
      setForms((current) => current.map((form) => form.id === selected.id ? { ...form, status } : form));
      setNotice(status === "closed" ? "Registration closed." : `Form saved as ${status}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Form could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!selected) return <StatusMessage>Create an internal-registration hackathon to start a form.</StatusMessage>;

  const customFieldCount = selected.fields.filter(isCustomField).length;
  const canAddCustomField = customFieldCount < CUSTOM_FIELD_LIMIT;

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardHeader eyebrow="Forms" title="Registration forms" />
        <div className="space-y-2">
          {forms.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => setSelectedId(form.id)}
              className={`w-full rounded-xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedId === form.id ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <p className="text-sm font-semibold text-slate-950">{form.title}</p>
              <p className="mt-1 text-xs text-slate-500">{form.opportunityTitle}</p>
              <Badge tone="slate" className="mt-2">{form.status}</Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {error ? <StatusMessage tone="error" className="mb-4">{error}</StatusMessage> : null}
        {notice ? <StatusMessage tone="success" className="mb-4">{notice}</StatusMessage> : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardHeader eyebrow="Hackathon form builder" title={selected.title} />
          <Button size="sm" variant="secondary" onClick={() => setPreview((value) => !value)}>
            <Eye size={15} />{preview ? "Edit form" : "Preview form"}
          </Button>
        </div>

        {preview ? (
          <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {selected.fields.map((field) => (
              <label key={field.fieldKey} className="block">
                <span className="text-sm font-semibold text-slate-900">{field.label}{field.required ? " *" : ""}</span>
                {field.helpText ? <span className="mt-1 block text-xs text-slate-500">{field.helpText}</span> : null}
                {field.fieldType === "long_text" ? (
                  <textarea disabled rows={3} placeholder={String(field.configuration?.placeholder ?? "")} className="mt-2 w-full rounded-lg border border-slate-300 bg-white" />
                ) : (
                  <input disabled placeholder={String(field.configuration?.placeholder ?? "")} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white" />
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {selected.fields.map((field, index) => (
              <div key={field.fieldKey} className="grid min-w-0 gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-600" htmlFor={`field-label-${index}`}>Question</label>
                  <input
                    id={`field-label-${index}`}
                    value={field.label}
                    onChange={(event) => updateFields(selected.fields.map((item, itemIndex) => itemIndex === index ? {
                      ...item,
                      label: event.target.value,
                      fieldKey: isCustomField(item) ? keyFromLabel(event.target.value, index) : item.fieldKey
                    } : item))}
                    className="h-10 min-w-0 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    aria-label={`Help text for ${field.label}`}
                    placeholder="Optional help text"
                    value={field.helpText ?? ""}
                    onChange={(event) => updateFields(selected.fields.map((item, itemIndex) => itemIndex === index ? { ...item, helpText: event.target.value } : item))}
                    className="h-9 min-w-0 rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    aria-label={`Placeholder for ${field.label}`}
                    placeholder="Optional answer placeholder"
                    value={String(field.configuration?.placeholder ?? "")}
                    onChange={(event) => updateFields(selected.fields.map((item, itemIndex) => itemIndex === index ? { ...item, configuration: { ...(item.configuration ?? {}), placeholder: event.target.value } } : item))}
                    className="h-9 min-w-0 rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <label className="grid content-start gap-2 text-xs font-semibold text-slate-600">
                  Answer type
                  <select
                    value={field.fieldType}
                    onChange={(event) => updateFields(selected.fields.map((item, itemIndex) => itemIndex === index ? { ...item, fieldType: event.target.value } : item))}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {(isCustomField(field) ? ["short_text", "long_text"] : fieldTypes).map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-1 self-center">
                  <label className="mr-1 flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={field.required} onChange={(event) => updateFields(selected.fields.map((item, itemIndex) => itemIndex === index ? { ...item, required: event.target.checked } : item))} />
                    Required
                  </label>
                  <button type="button" aria-label="Move question up" onClick={() => move(index, -1)} className="rounded-md p-2 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"><ArrowUp size={15} /></button>
                  <button type="button" aria-label="Move question down" onClick={() => move(index, 1)} className="rounded-md p-2 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"><ArrowDown size={15} /></button>
                  {isCustomField(field) ? (
                    <button type="button" aria-label="Remove custom question" onClick={() => updateFields(selected.fields.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md p-2 text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"><Trash2 size={15} /></button>
                  ) : null}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                disabled={!canAddCustomField}
                onClick={() => updateFields([...selected.fields, {
                  fieldKey: keyFromLabel("new question", selected.fields.length),
                  label: "New question",
                  fieldType: "short_text",
                  required: false,
                  configuration: { pilotCustom: true }
                }])}
              >
                <Plus size={16} />Add custom question
              </Button>
              <p className="text-xs text-slate-500">{customFieldCount} of {CUSTOM_FIELD_LIMIT} custom questions used.</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <Button disabled={busy} variant="secondary" onClick={() => void save("draft")}>
            {busy ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}Save draft
          </Button>
          <Button disabled={busy} onClick={() => void save("published")}>Publish form</Button>
          <Button disabled={busy} variant="secondary" onClick={() => void save("closed")}>Close registration</Button>
        </div>
      </Card>
    </div>
  );
}

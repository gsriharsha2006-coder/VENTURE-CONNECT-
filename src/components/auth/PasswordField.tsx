"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  error
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const descriptionId = hint || error ? `${id}-description` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
        <LockKeyhole aria-hidden="true" size={17} className="shrink-0 text-slate-400" />
        <input
          id={id}
          value={value}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          placeholder="At least 8 characters"
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          {visible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
        </button>
      </div>
      {hint || error ? (
        <p id={descriptionId} className={`mt-2 text-xs leading-5 ${error ? "text-rose-700" : "text-slate-500"}`}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { SCHEMA_FIELDS } from "@/lib/constants";
import { Banner, Button, EmptyState, Field, Panel, Select } from "./ui";

type Preview = {
  headers: string[];
  rowCount: number;
  preview: Record<string, string>[];
  mapping: Record<string, string>;
  parseErrors: string[];
};

type Summary = {
  filename: string;
  accepted: number;
  rejected: number;
  duplicates: number;
  invalidDates: number;
  missingFieldCounts: Record<string, number>;
  preview: { recordId: string; score: number; category: string; missing: string[] }[];
  errors: { row: number; reason: string }[];
};

export function ImportView() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | null) {
    setFile(f);
    setSummary(null);
    setError(null);
    setPreview(null);
    if (!f) return;
    const form = new FormData();
    form.set("file", f);
    const res = await fetch("/api/import/preview", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Preview failed");
      return;
    }
    setPreview(data as Preview);
    setMapping((data as Preview).mapping);
  }

  async function commit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("mapping", JSON.stringify(mapping));
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    setSummary(data.summary as Summary);
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Data import</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Anonymised CSV in, scored fleet out</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Do not upload owner names or unmasked registration numbers. Use record IDs.
          Maximum 2 MB / 5,000 rows. Files stay in the local adapter — not a public bucket.
        </p>
      </header>
      <Banner>
        Need a starting point?{" "}
        <a className="text-terracotta underline" href="/api/import/template">
          Download the sample template
        </a>
        . Imported rows are labelled <code>user_import</code>.
      </Banner>

      <Panel title="Upload">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}
      </Panel>

      {preview ? (
        <Panel title={`Column mapping · ${preview.rowCount} rows`}>
          {preview.parseErrors.length ? (
            <p className="mb-3 text-sm text-alert">{preview.parseErrors.join(" ")}</p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {SCHEMA_FIELDS.map((field) => (
              <Field key={field.key} label={field.label}>
                <Select
                  value={mapping[field.key] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                >
                  <option value="">— skip —</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[rgba(52,48,46,0.1)] text-mist">
                  {preview.headers.map((h) => (
                    <th key={h} className="py-2 pr-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row, i) => (
                  <tr key={i} className="border-b border-[rgba(52,48,46,0.06)]">
                    {preview.headers.map((h) => (
                      <td key={h} className="py-1.5 pr-3">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button onClick={() => void commit()} disabled={busy || !mapping.record_id}>
              {busy ? "Importing…" : "Validate and import"}
            </Button>
            {!mapping.record_id ? (
              <p className="mt-2 text-[12px] text-mist">Map a record_id column before importing.</p>
            ) : null}
          </div>
        </Panel>
      ) : (
        <EmptyState
          title="No file selected"
          body="Choose a CSV to preview headers, map columns, and see the first rows."
        />
      )}

      {summary ? (
        <Panel title="Import summary">
          <p className="text-sm">
            {summary.filename}: {summary.accepted} accepted, {summary.rejected} rejected,{" "}
            {summary.duplicates} duplicates, {summary.invalidDates} invalid dates.
          </p>
          <ul className="mt-3 grid gap-1 text-[13px] text-mist">
            {Object.entries(summary.missingFieldCounts).map(([k, v]) => (
              <li key={k}>
                Missing {k.replace(/_/g, " ")} in accepted rows: {v}
              </li>
            ))}
          </ul>
          {summary.errors.length ? (
            <ul className="mt-3 grid gap-1 text-[13px] text-alert">
              {summary.errors.map((e) => (
                <li key={`${e.row}-${e.reason}`}>
                  Row {e.row}: {e.reason}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[10px] uppercase tracking-[0.12em] text-mist">
                <tr>
                  <th className="py-2 pr-3">Record</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Band</th>
                  <th className="py-2">Missing</th>
                </tr>
              </thead>
              <tbody>
                {summary.preview.map((r) => (
                  <tr key={r.recordId} className="border-t border-[rgba(52,48,46,0.06)]">
                    <td className="py-2 pr-3">{r.recordId}</td>
                    <td className="py-2 pr-3">{r.score}</td>
                    <td className="py-2 pr-3">{r.category}</td>
                    <td className="py-2 text-mist">{(r.missing ?? []).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a className="mt-4 inline-block text-sm text-terracotta underline" href="/api/export">
            Download cleaned dataset
          </a>
        </Panel>
      ) : null}
    </div>
  );
}

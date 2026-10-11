"use client";

import { CATEGORIES, EMISSIONS, FITNESS_STATUSES, FUELS, PUC_STATUSES, AGE_BANDS } from "@/lib/constants";
import { STATE_NAMES, STATE_RTOS } from "@/data/india";
import { Field, Select, Input } from "./ui";
import type { Filters } from "@/lib/types";

export function FilterBar({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const rtos = value.state ? STATE_RTOS[value.state] ?? [] : [];

  return (
    <div className="revolve-card grid gap-3 p-4 md:grid-cols-4 lg:grid-cols-6">
      <Field label="State / region">
        <Select
          value={value.state ?? ""}
          onChange={(e) => set({ state: e.target.value || undefined, rto: undefined })}
        >
          <option value="">All states</option>
          {STATE_NAMES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="RTO / district">
        <Select
          value={value.rto ?? ""}
          onChange={(e) => set({ rto: e.target.value || undefined })}
          disabled={!rtos.length}
        >
          <option value="">All RTOs</option>
          {rtos.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Vehicle category">
        <Select value={value.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
          <option value="">All categories</option>
          {CATEGORIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fuel type">
        <Select value={value.fuel ?? ""} onChange={(e) => set({ fuel: e.target.value || undefined })}>
          <option value="">All fuels</option>
          {FUELS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bharat Stage">
        <Select value={value.emission ?? ""} onChange={(e) => set({ emission: e.target.value || undefined })}>
          <option value="">All norms</option>
          {EMISSIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Age band">
        <Select value={value.ageBand ?? ""} onChange={(e) => set({ ageBand: e.target.value || undefined })}>
          <option value="">All ages</option>
          {AGE_BANDS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fitness status">
        <Select value={value.fitness ?? ""} onChange={(e) => set({ fitness: e.target.value || undefined })}>
          <option value="">All fitness</option>
          {FITNESS_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="PUC status">
        <Select value={value.puc ?? ""} onChange={(e) => set({ puc: e.target.value || undefined })}>
          <option value="">All PUC</option>
          {PUC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Source">
        <Select value={value.source ?? ""} onChange={(e) => set({ source: e.target.value || undefined })}>
          <option value="">All sources</option>
          <option value="synthetic_demo">Synthetic demo</option>
          <option value="user_import">User import</option>
          <option value="document_extract">Document extract</option>
        </Select>
      </Field>
      <Field label="Registration from">
        <Input
          type="number"
          min={1985}
          max={2026}
          placeholder="1998"
          value={value.yearFrom ?? ""}
          onChange={(e) => set({ yearFrom: e.target.value ? Number(e.target.value) : undefined })}
        />
      </Field>
      <Field label="Registration to">
        <Input
          type="number"
          min={1985}
          max={2026}
          placeholder="2026"
          value={value.yearTo ?? ""}
          onChange={(e) => set({ yearTo: e.target.value ? Number(e.target.value) : undefined })}
        />
      </Field>
      <Field label="Search record">
        <Input
          placeholder="ID, city…"
          value={value.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
        />
      </Field>
    </div>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, FUEL_COLORS, PRIORITY_COLORS } from "@/lib/constants";

type TipPayload = { name?: string; value?: number; color?: string; payload?: Record<string, unknown> };

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[rgba(52,48,46,0.12)] bg-white px-3 py-2 text-[12px] shadow-sm">
      {label != null ? <p className="mb-1 font-medium text-charcoal">{label}</p> : null}
      {payload.map((p) => (
        <p key={String(p.name)} className="text-mist">
          <span className="inline-block size-2 mr-1.5" style={{ background: p.color }} />
          {p.name}: <span className="tabular text-charcoal">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AgeStackChart({
  data,
}: {
  data: { band: string; count: number; high: number; elevated: number }[];
}) {
  const rows = data.map((d) => ({
    band: d.band,
    High: d.high,
    Elevated: d.elevated,
    Other: Math.max(0, d.count - d.high - d.elevated),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} barCategoryGap={18}>
        <CartesianGrid stroke="#E9DFD2" vertical={false} />
        <XAxis dataKey="band" tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#8B8580" }} />
        <Bar dataKey="High" stackId="a" fill="#B5442E" />
        <Bar dataKey="Elevated" stackId="a" fill="#E88D78" />
        <Bar dataKey="Other" stackId="a" fill="#E9DFD2" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FuelPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={1} stroke="#FAF7F2">
          {data.map((d) => (
            <Cell key={d.name} fill={FUEL_COLORS[d.name] ?? "#8B8580"} />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({
  data,
  color = "#C7654A",
}: {
  data: { name: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <CartesianGrid stroke="#E9DFD2" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{ fill: "#34302E", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<Tip />} />
        <Bar dataKey="value" fill={color} barSize={12}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data }: { data: { year: number; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid stroke="#E9DFD2" />
        <XAxis dataKey="year" tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} />
        <Line type="monotone" dataKey="value" name="Records" stroke="#C7654A" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RegionBars({
  data,
}: {
  data: { name: string; elevatedPct: number; count: number }[];
}) {
  const rows = data.slice(0, 12).map((d) => ({
    name: d.name.replace(" and ", " & "),
    "Elevated %": Number(d.elevatedPct.toFixed(1)),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 8 }}>
        <CartesianGrid stroke="#E9DFD2" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#34302E", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} />
        <Bar dataKey="Elevated %" fill="#C7654A" barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CompareBars({
  data,
}: {
  data: { name: string; coverage: number; catch: number; share: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid stroke="#E9DFD2" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#8B8580", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8B8580", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="coverage" name="Priority-point coverage %" fill="#C7654A" />
        <Bar dataKey="catch" name="High-priority catch %" fill="#E88D78" />
        <Bar dataKey="share" name="Share of fleet %" fill="#C4A574" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { PRIORITY_COLORS };

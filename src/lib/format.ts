export function pct(n: number, d = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(d)}%`;
}

export function nfmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-IN");
}

export function inr(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function compact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

export function ageBandLabel(year: number | null, ref = 2026): string {
  if (year == null) return "Unknown";
  const age = ref - year;
  if (age <= 5) return "0–5";
  if (age <= 10) return "6–10";
  if (age <= 15) return "11–15";
  if (age <= 20) return "16–20";
  return "21+";
}

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "" || v === false) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

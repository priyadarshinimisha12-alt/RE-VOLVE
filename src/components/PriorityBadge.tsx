import { PRIORITY_COLORS } from "@/lib/constants";

export function PriorityBadge({ category }: { category: string | null | undefined }) {
  const label = category ?? "Unscored";
  const color = PRIORITY_COLORS[label] ?? "#8B8580";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

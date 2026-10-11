import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles: Record<string, string> = {
    primary: "bg-terracotta text-ivory hover:bg-[#b85a42]",
    secondary: "bg-white text-charcoal border border-[rgba(52,48,46,0.14)] hover:bg-sand/60",
    ghost: "bg-transparent text-charcoal hover:bg-sand/70",
    danger: "bg-alert text-ivory hover:bg-[#9c3b28]",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium tracking-wide transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-mist">
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

const control =
  "w-full border border-[rgba(52,48,46,0.14)] bg-white px-3 py-2 text-sm text-charcoal placeholder:text-mist";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={control} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={control} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${control} min-h-32`} {...props} />;
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <div className="border border-[rgba(52,48,46,0.1)] bg-sand/70 px-4 py-3 text-[13px] leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "alert" | "warm";
}) {
  const color =
    tone === "alert" ? "text-alert" : tone === "warm" ? "text-terracotta" : "text-charcoal";
  return (
    <div className="revolve-card px-4 py-3">
      <Label>{label}</Label>
      <p className={`font-display mt-2 text-[1.85rem] leading-none tabular ${color}`}>{value}</p>
      {hint ? <p className="mt-2 text-[11px] leading-snug text-mist">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`revolve-card ${className}`}>
      {(title || action) && (
        <header className="flex items-end justify-between gap-3 border-b border-[rgba(52,48,46,0.08)] px-4 py-3">
          <div>
            {eyebrow ? <Label>{eyebrow}</Label> : null}
            {title ? (
              <h2 className="font-display mt-1 text-lg tracking-tight text-charcoal">{title}</h2>
            ) : null}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-[rgba(52,48,46,0.18)] bg-ivory px-6 py-10 text-center">
      <p className="font-display text-xl text-charcoal">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-mist">{body}</p>
    </div>
  );
}

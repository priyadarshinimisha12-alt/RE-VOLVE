"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  MessageSquareText,
  Settings,
  SlidersHorizontal,
  Upload,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assess", label: "Assessment", icon: ClipboardList },
  { href: "/insights", label: "Regional insights", icon: Map },
  { href: "/simulator", label: "Simulator", icon: SlidersHorizontal },
  { href: "/import", label: "Data import", icon: Upload },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/assistant", label: "Assistant", icon: MessageSquareText },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="grid gap-0.5">
      {NAV.map((item) => {
        const active = path === item.href || path.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 text-[13px] ${
              active
                ? "bg-terracotta text-ivory"
                : "text-charcoal/80 hover:bg-sand/80"
            }`}
          >
            <Icon size={16} strokeWidth={1.7} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgba(52,48,46,0.1)] bg-ivory/95 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen((v) => !v)}
          className="p-2"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open ? <div className="border-b border-[rgba(52,48,46,0.1)] bg-white p-3 md:hidden">{links}</div> : null}

      <div className="mx-auto grid max-w-[1440px] md:grid-cols-[230px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-[rgba(52,48,46,0.1)] bg-[#fffdf9] p-5 md:flex md:flex-col">
          <Link href="/" className="mb-8 block">
            <Logo />
          </Link>
          {links}
          <p className="mt-auto pt-8 text-[11px] leading-relaxed text-mist">
            Prototype decision support. Not an official government system.
          </p>
        </aside>
        <div className="min-w-0">
          <div className="hidden items-center justify-between border-b border-[rgba(52,48,46,0.08)] px-8 py-3 md:flex">
            <p className="text-[12px] tracking-wide text-mist">
              Inspection priority · evidence over assumption
            </p>
            <Link href="/" className="text-[12px] text-terracotta hover:underline">
              Back to overview
            </Link>
          </div>
          <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

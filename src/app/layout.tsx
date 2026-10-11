import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RE-VOLVE — Vehicle Retirement & Environmental Intelligence",
  description:
    "Smarter vehicle decisions. Cleaner cities. Inspection-priority intelligence from available vehicle and compliance evidence — not assumed pollution.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${fraunces.variable} bg-ivory text-charcoal antialiased`}>
        {children}
      </body>
    </html>
  );
}

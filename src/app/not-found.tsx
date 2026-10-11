import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-6">
      <div className="max-w-md">
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">RE-VOLVE</p>
        <h1 className="font-display mt-2 text-4xl">Page not found</h1>
        <p className="mt-3 text-sm text-mist">
          That route is not part of the vehicle intelligence workspace.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block bg-terracotta px-4 py-2 text-sm text-ivory">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

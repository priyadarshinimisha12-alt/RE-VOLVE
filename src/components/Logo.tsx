export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" fill="#C7654A" />
        <path
          d="M8 18c0-5 3.6-8.5 8.2-8.5 3.4 0 6 1.7 7.3 4.2"
          fill="none"
          stroke="#FAF7F2"
          strokeWidth="1.7"
        />
        <path
          d="M24 14c0 5-3.6 8.5-8.2 8.5-3.4 0-6-1.7-7.3-4.2"
          fill="none"
          stroke="#E9DFD2"
          strokeWidth="1.7"
        />
        <circle cx="23.6" cy="12.2" r="1.3" fill="#FAF7F2" />
        <circle cx="8.4" cy="19.8" r="1.3" fill="#E9DFD2" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[1.15rem] tracking-tight text-charcoal">
            RE-VOLVE
          </span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-mist">
            Vehicle intelligence
          </span>
        </span>
      )}
    </span>
  );
}

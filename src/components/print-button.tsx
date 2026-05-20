"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      className="no-print mt-5 min-h-10 w-full rounded-xl bg-stone-950 font-bold text-white"
      onClick={() => window.print()}
      type="button"
    >
      {label}
    </button>
  );
}

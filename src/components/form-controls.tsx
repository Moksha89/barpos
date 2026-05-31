import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="min-h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none ring-[var(--color-gold)] transition placeholder:text-stone-400 focus:border-[var(--color-gold)] focus:ring-2"
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none ring-[var(--color-gold)] transition focus:border-[var(--color-gold)] focus:ring-2"
    />
  );
}

export function Checkbox({ label, name, defaultChecked = true }: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-bold text-stone-700">
      <input className="h-4 w-4 accent-[var(--color-gold)]" name={name} type="checkbox" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="min-h-10 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold)] px-4 text-sm font-black text-stone-950 shadow-sm transition hover:bg-[var(--color-gold-dark)]"
      type="submit"
    >
      {children}
    </button>
  );
}

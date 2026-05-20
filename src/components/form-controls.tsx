import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold text-stone-700">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="min-h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-sm outline-none ring-amber-300 transition focus:ring-2"
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-sm outline-none ring-amber-300 transition focus:ring-2"
    />
  );
}

export function Checkbox({ label, name, defaultChecked = true }: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 rounded-lg border border-stone-200 px-2.5 text-sm font-semibold text-stone-700">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="min-h-9 rounded-lg bg-stone-950 px-3 text-sm font-bold text-white transition hover:bg-stone-800"
      type="submit"
    >
      {children}
    </button>
  );
}

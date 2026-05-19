import type { ReactNode } from "react";

export function AdminCard({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-2xl font-black">{title}</h2>
      {description ? <p className="mt-2 text-sm text-stone-600">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

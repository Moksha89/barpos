"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui";

export function DayActionDialog({
  action,
  buttonClassName,
  buttonSize = "md",
  buttonVariant = "secondary",
  children,
  helper,
  title,
}: {
  action: (formData: FormData) => void | Promise<void>;
  buttonClassName?: string;
  buttonSize?: "sm" | "md" | "lg";
  buttonVariant?: "primary" | "secondary" | "dark" | "danger" | "ghost";
  children: ReactNode;
  helper: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button
        className={buttonClassName}
        onClick={() => setOpen(true)}
        size={buttonSize}
        type="button"
        variant={buttonVariant}
      >
        {children}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <button
            aria-label={`Close ${title} popup`}
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative w-full rounded-t-[28px] border border-white/70 bg-white p-4 shadow-2xl sm:max-w-md sm:rounded-[28px] sm:p-5"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
                  Passcode required
                </p>
                <h2 className="mt-1 text-xl font-black text-stone-950" id={titleId}>
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-5 text-stone-600">{helper}</p>
              </div>
              <button
                aria-label={`Close ${title} popup`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-stone-600 transition hover:bg-stone-50"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="mt-4 grid gap-4">
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
                Passcode
                <input
                  autoComplete="off"
                  autoFocus
                  className="min-h-11 rounded-lg border border-[var(--color-border)] px-3 text-center text-lg font-black tracking-[0.35em] outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
                  inputMode="numeric"
                  name="dayPasscode"
                  placeholder="1599"
                  type="password"
                  required
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button type="submit">Confirm</Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

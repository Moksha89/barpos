"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";

import { createTable } from "@/lib/actions";
import { Button } from "@/components/ui";

type TableStaff = {
  id: string;
  name: string;
};

export function AddTableDialog({
  buttonClassName,
  buttonSize = "md",
  staff,
  suggestedTableNumber,
}: {
  buttonClassName?: string;
  buttonSize?: "sm" | "md" | "lg";
  staff: TableStaff[];
  suggestedTableNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button className={buttonClassName} onClick={() => setOpen(true)} size={buttonSize} type="button">
        <Plus className="h-4 w-4" />
        Add New Table
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <button
            aria-label="Close add table popup"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white p-4 shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-5"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
                  New bill
                </p>
                <h2 className="mt-1 text-xl font-black text-stone-950" id={titleId}>
                  Add New Table
                </h2>
                <p className="mt-1 text-sm leading-5 text-stone-600">
                  Create a running table bill and open POS billing immediately.
                </p>
              </div>
              <button
                aria-label="Close add table popup"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-stone-600 transition hover:bg-stone-50"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={createTable} className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
                  Table number
                  <input
                    className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
                    defaultValue={suggestedTableNumber}
                    min="1"
                    name="tableNumber"
                    type="number"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
                  Table name
                  <input
                    className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
                    defaultValue={`Table ${suggestedTableNumber}`}
                    name="tableName"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
                  Customer name optional
                  <input
                    className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
                    name="customerName"
                    placeholder="Walk-in / customer name"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
                  Waitress / staff
                  <select
                    className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
                    name="staffId"
                    required
                  >
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
                  Number of guests optional
                  <input
                    className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
                    min="0"
                    name="guestCount"
                    type="number"
                  />
                </label>
              </div>
              <div className="grid gap-2 border-t border-[var(--color-border)] pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="text-xs font-semibold text-stone-500">
                  This uses the same billing logic and opens the POS after saving.
                </p>
                <Button className="min-h-11 w-full sm:w-auto" type="submit">
                  Open POS Billing
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

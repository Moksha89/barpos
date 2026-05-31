export function DateRangeFilter({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  return (
    <form className="grid gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm sm:flex sm:items-end">
      <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-600">
        Start date
        <input
          className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
          defaultValue={startDate}
          name="startDate"
          type="date"
        />
      </label>
      <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-600">
        End date
        <input
          className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
          defaultValue={endDate}
          name="endDate"
          type="date"
        />
      </label>
      <button className="min-h-10 rounded-lg bg-[var(--color-gold)] px-4 text-sm font-black text-stone-950 shadow-sm transition hover:bg-[var(--color-gold-dark)]" type="submit">
        Apply
      </button>
    </form>
  );
}

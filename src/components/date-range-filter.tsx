export function DateRangeFilter({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  return (
    <form className="grid gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:flex sm:items-end">
      <label className="grid gap-1 text-xs font-bold text-stone-600">
        Start date
        <input
          className="min-h-9 rounded-lg border border-stone-200 px-2.5 text-sm"
          defaultValue={startDate}
          name="startDate"
          type="date"
        />
      </label>
      <label className="grid gap-1 text-xs font-bold text-stone-600">
        End date
        <input
          className="min-h-9 rounded-lg border border-stone-200 px-2.5 text-sm"
          defaultValue={endDate}
          name="endDate"
          type="date"
        />
      </label>
      <button className="min-h-9 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
        Apply
      </button>
    </form>
  );
}

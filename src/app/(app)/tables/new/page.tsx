import { createTable } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrOpenBusinessDay, nextTableNumber } from "@/lib/tables";
import { Button } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewTablePage() {
  await requirePermission("pos.create");
  const [businessDay, staff] = await Promise.all([
    getOrOpenBusinessDay(),
    prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const suggestedTableNumber = await nextTableNumber(businessDay.id);

  return (
    <div className="app-page text-stone-950">
      <div className="mx-auto w-full max-w-3xl">
        <header className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
            New Bill
          </p>
          <h1 className="mt-1 text-2xl font-black">Add New Table</h1>
          <p className="mt-1 text-sm text-stone-600">
            Today&apos;s table numbering starts at 1 and continues until day closing.
          </p>
        </header>

        <form action={createTable} className="mt-4 grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
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
              <select className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]" name="staffId" required>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
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
          <Button className="w-full sm:w-auto" type="submit">
            Open POS Billing
          </Button>
        </form>
      </div>
    </div>
  );
}

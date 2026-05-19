import { createTable } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrOpenBusinessDay, nextTableNumber } from "@/lib/tables";

export const dynamic = "force-dynamic";

export default async function NewTablePage() {
  await requirePermission("pos.create");
  const [businessDay, staff] = await Promise.all([
    getOrOpenBusinessDay(),
    prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const suggestedTableNumber = await nextTableNumber(businessDay.id);

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            New Bill
          </p>
          <h1 className="mt-2 text-3xl font-black">Add New Table</h1>
          <p className="mt-2 text-stone-600">
            Today&apos;s table numbering starts at 1 and continues until day closing.
          </p>
        </header>

        <form action={createTable} className="mt-6 grid gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Table number
              <input
                className="min-h-12 rounded-2xl border border-stone-200 px-3"
                defaultValue={suggestedTableNumber}
                min="1"
                name="tableNumber"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Table name
              <input
                className="min-h-12 rounded-2xl border border-stone-200 px-3"
                defaultValue={`Table ${suggestedTableNumber}`}
                name="tableName"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Customer name optional
              <input
                className="min-h-12 rounded-2xl border border-stone-200 px-3"
                name="customerName"
                placeholder="Walk-in / customer name"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Waitress / staff
              <select className="min-h-12 rounded-2xl border border-stone-200 px-3" name="staffId" required>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Number of guests optional
              <input
                className="min-h-12 rounded-2xl border border-stone-200 px-3"
                min="0"
                name="guestCount"
                type="number"
              />
            </label>
          </div>
          <button className="min-h-12 rounded-2xl bg-amber-400 px-5 font-black text-stone-950" type="submit">
            Open POS Billing
          </button>
        </form>
      </div>
    </div>
  );
}

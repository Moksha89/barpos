import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createCommissionRule } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { dateRangeFromSearchParams } from "@/lib/date-range";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CommissionPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requirePermission("commission.manage");
  const range = dateRangeFromSearchParams(await searchParams);
  const [rules, staff, categories, items, ledgerCommissions, paidOrders] = await Promise.all([
    prisma.staffCommissionRule.findMany({
      include: {
        staff: true,
        categories: { include: { category: true } },
        items: { include: { item: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staff.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({ orderBy: { name: "asc" } }),
    prisma.staffLedgerEntry.findMany({
      where: { type: "COMMISSION_EARNED", createdAt: { gte: range.start, lt: range.end } },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: range.start, lt: range.end } },
      include: { staff: true },
    }),
  ]);
  const staffTotals = new Map<string, { sales: number; commission: number; bills: number }>();
  for (const order of paidOrders) {
    const row = staffTotals.get(order.staff.name) ?? { sales: 0, commission: 0, bills: 0 };
    row.sales += order.netSalesCents;
    row.bills += 1;
    staffTotals.set(order.staff.name, row);
  }
  for (const entry of ledgerCommissions) {
    const row = staffTotals.get(entry.staff.name) ?? { sales: 0, commission: 0, bills: 0 };
    row.commission += entry.creditCents;
    staffTotals.set(entry.staff.name, row);
  }
  const commissionRows = [...staffTotals.entries()].map(([name, totals]) => ({ name, ...totals })).sort((a, b) => b.commission - a.commission);
  const totalCommissionCents = commissionRows.reduce((total, row) => total + row.commission, 0);

  return (
    <div className="p-2.5 text-stone-950 sm:p-4">
      <div className="mx-auto grid max-w-7xl gap-3">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Admin</p>
            <h1 className="mt-1 text-lg font-black sm:text-2xl">Commission Rules</h1>
            <p className="mt-1 text-sm text-stone-600">Configure rates and filter earned commission by date.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">Total commission</p>
            <p className="mt-1 text-lg font-black">{formatCurrency(totalCommissionCents)}</p>
          </article>
          {commissionRows.slice(0, 3).map((row, index) => (
            <article className="rounded-xl bg-white p-3 shadow-sm" key={row.name}>
              <p className="text-xs font-semibold text-stone-500">#{index + 1} {row.name}</p>
              <p className="mt-1 text-lg font-black">{formatCurrency(row.commission)}</p>
              <p className="text-xs text-stone-500">Sales {formatCurrency(row.sales)}</p>
            </article>
          ))}
        </section>

        <AdminCard title="Filtered Commission" eyebrow={`${commissionRows.length} staff`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr><th className="px-2 py-2">Waitress</th><th className="px-2 py-2">Bills</th><th className="px-2 py-2">Sales</th><th className="px-2 py-2">Commission</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {commissionRows.map((row) => (
                  <tr key={row.name}><td className="px-2 py-2 font-bold">{row.name}</td><td className="px-2 py-2">{row.bills}</td><td className="px-2 py-2">{formatCurrency(row.sales)}</td><td className="px-2 py-2 font-black">{formatCurrency(row.commission)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard title="Create Commission Rule">
          <form action={createCommissionRule} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Rule name">
                <TextInput name="name" placeholder="25% waitress alcohol rule" required />
              </Field>
              <Field label="Staff optional">
                <SelectInput name="staffId">
                  <option value="">Default / all eligible staff</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Normal commission %">
                <TextInput name="normalCommissionPercent" type="number" min="0" step="0.01" required />
              </Field>
              <Field label="Special commission %">
                <TextInput name="specialCommissionPercent" type="number" min="0" step="0.01" required />
              </Field>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <fieldset className="rounded-xl border border-stone-200 p-3">
                <legend className="px-2 text-sm font-bold">Eligible categories</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex gap-2 text-sm">
                      <input name="categoryIds" type="checkbox" value={category.id} />
                      {category.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="rounded-xl border border-stone-200 p-3">
                <legend className="px-2 text-sm font-bold">Special/selected items</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((item) => (
                    <label key={item.id} className="flex gap-2 text-sm">
                      <input name="itemIds" type="checkbox" value={item.id} />
                      {item.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <Checkbox name="active" label="Active" />
            <SubmitButton>Create rule</SubmitButton>
          </form>
        </AdminCard>

        <AdminCard title="Configured Rules" eyebrow={`${rules.length} rules`}>
          <div className="grid gap-3">
            {rules.map((rule) => (
              <article key={rule.id} className="rounded-xl border border-stone-200 p-4">
                <h2 className="font-black">{rule.name}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Staff: {rule.staff?.name ?? "Default"} · Normal {rule.normalCommissionPercent}% · Special {rule.specialCommissionPercent}%
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Categories: {rule.categories.map((entry) => entry.category.name).join(", ") || "none"} · Items: {rule.items.map((entry) => entry.item.name).join(", ") || "none"}
                </p>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { StatCard, TableShell } from "@/components/ui";
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
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <header className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">Admin</p>
            <h1 className="mt-1 text-lg font-black sm:text-2xl">Commission Rules</h1>
            <p className="mt-1 text-sm text-stone-600">Waitress normal rates are managed in Staff. Special drinks are fixed at 50%.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total commission" value={formatCurrency(totalCommissionCents)} />
          {commissionRows.slice(0, 3).map((row, index) => (
            <StatCard key={row.name} label={`#${index + 1} ${row.name}`} value={formatCurrency(row.commission)} helper={`Sales ${formatCurrency(row.sales)}`} accent="gold" />
          ))}
        </section>

        <AdminCard title="Filtered Commission" eyebrow={`${commissionRows.length} staff`}>
          <TableShell>
            <table className="premium-table min-w-[520px] text-left">
              <thead>
                <tr><th>Waitress</th><th>Bills</th><th className="currency-cell">Sales</th><th className="currency-cell">Commission</th></tr>
              </thead>
              <tbody>
                {commissionRows.map((row) => (
                  <tr key={row.name}><td className="font-bold">{row.name}</td><td>{row.bills}</td><td className="currency-cell">{formatCurrency(row.sales)}</td><td className="currency-cell font-black">{formatCurrency(row.commission)}</td></tr>
                ))}
              </tbody>
            </table>
          </TableShell>
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
                <TextInput name="specialCommissionPercent" type="number" min="0" step="0.01" defaultValue="50" required />
              </Field>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <fieldset className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm">
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
              <fieldset className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm">
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
              <article key={rule.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <h2 className="font-black">{rule.name}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Staff: {rule.staff?.name ?? "Default"} · Normal {rule.normalCommissionPercent}% · Special 50% fixed
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

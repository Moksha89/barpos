import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import { StatCard, TableShell } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { dateRangeFromSearchParams, groupDateKey } from "@/lib/date-range";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { summarizeOrders } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const range = dateRangeFromSearchParams(params);

  const [orders, expenses, tips, inventoryTransactions, complimentaryItems, ledgerCommissions, advances, settlements, staff] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: range.start, lt: range.end } },
      include: { payments: true, staff: true },
      orderBy: { paidAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: range.start, lt: range.end } },
      include: { category: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.tip.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: { staff: true, order: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryTransaction.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: { item: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderItem.findMany({
      where: { isComplimentary: true, order: { paidAt: { gte: range.start, lt: range.end }, status: "PAID" } },
      include: { item: true, offer: true, order: { include: { staff: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffLedgerEntry.findMany({
      where: { type: "COMMISSION_EARNED", createdAt: { gte: range.start, lt: range.end } },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffAdvance.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffSettlement.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const expenseCents = expenses.reduce((total, expense) => total + expense.amountCents, 0);
  const orderSummary = summarizeOrders(orders, expenseCents);
  const totalCommissionCents = ledgerCommissions.reduce((total, entry) => total + entry.creditCents, 0);
  const netProfitCents = orderSummary.netSalesCents - orderSummary.inventoryCostCents - totalCommissionCents - expenseCents;

  const paymentBreakdown = new Map<string, number>();
  for (const order of orders) {
    for (const payment of order.payments) {
      const key = payment.reference || payment.mode;
      paymentBreakdown.set(key, (paymentBreakdown.get(key) ?? 0) + payment.amountCents);
    }
  }

  const expenseBreakdown = new Map<string, number>();
  for (const expense of expenses) {
    expenseBreakdown.set(expense.category.name, (expenseBreakdown.get(expense.category.name) ?? 0) + expense.amountCents);
  }

  const staffTotals = new Map<string, { sales: number; commission: number; tips: number; bills: number }>();
  for (const order of orders) {
    const current = staffTotals.get(order.staff.name) ?? { sales: 0, commission: 0, tips: 0, bills: 0 };
    current.sales += order.netSalesCents;
    current.tips += order.tipCents;
    current.bills += 1;
    staffTotals.set(order.staff.name, current);
  }
  for (const entry of ledgerCommissions) {
    const current = staffTotals.get(entry.staff.name) ?? { sales: 0, commission: 0, tips: 0, bills: 0 };
    current.commission += entry.creditCents;
    staffTotals.set(entry.staff.name, current);
  }
  const staffRows = staff.map((member) => {
    const totals = staffTotals.get(member.name) ?? { sales: 0, commission: 0, tips: 0, bills: 0 };
    const staffAdvances = advances.filter((advance) => advance.staffId === member.id);
    const staffSettlements = settlements.filter((settlement) => settlement.staffId === member.id);
    return {
      id: member.id,
      name: member.name,
      normalPercent: member.normalCommissionPercent,
      specialPercent: member.specialCommissionPercent,
      advances: staffAdvances.reduce((total, advance) => total + advance.amountCents, 0),
      payouts: staffSettlements.reduce((total, settlement) => total + settlement.amountPaidCents, 0),
      settlements: staffSettlements.length,
      ...totals,
    };
  });
  const topByCommission = [...staffRows].sort((a, b) => b.commission - a.commission).slice(0, 5);
  const topBySales = [...staffRows].sort((a, b) => b.sales - a.sales).slice(0, 5);

  const dailyRows = new Map<string, { sales: number; commission: number; tips: number; expenses: number; bills: number }>();
  const ensureDay = (key: string) => {
    const current = dailyRows.get(key) ?? { sales: 0, commission: 0, tips: 0, expenses: 0, bills: 0 };
    dailyRows.set(key, current);
    return current;
  };
  for (const order of orders) {
    const row = ensureDay(groupDateKey(order.paidAt));
    row.sales += order.netSalesCents;
    row.tips += order.tipCents;
    row.bills += 1;
  }
  for (const entry of ledgerCommissions) {
    ensureDay(groupDateKey(entry.createdAt)).commission += entry.creditCents;
  }
  for (const expense of expenses) {
    ensureDay(groupDateKey(expense.expenseDate)).expenses += expense.amountCents;
  }
  const daily = [...dailyRows.entries()]
    .map(([date, row]) => ({ date, ...row, profit: row.sales - row.commission - row.expenses }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <header className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">Reports</p>
            <h1 className="mt-1 text-lg font-black sm:text-2xl">Sales, commission and P/L</h1>
            <p className="mt-1 text-sm text-stone-600">Filter any date range for sales, tips, expenses, daily P/L and top waitresses.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-sm">
          <a className="shrink-0 rounded-full bg-stone-950 px-3 py-2 text-xs font-black text-white" href="#total-sales">Total sales</a>
          <a className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-700 hover:bg-amber-50" href="#total-commissions">Total commissions</a>
          <a className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-700 hover:bg-amber-50" href="#total-expenses">Total expenses</a>
          <a className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-700 hover:bg-amber-50" href="#profit-loss">P/L</a>
        </nav>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Sales" value={formatCurrency(orderSummary.netSalesCents)} />
          <StatCard accent="gold" label="Total Commission" value={formatCurrency(totalCommissionCents)} />
          <StatCard accent="green" label="Total Tips" value={formatCurrency(orderSummary.tipsCents)} />
          <StatCard accent="red" label="Expenses" value={formatCurrency(expenseCents)} />
          <StatCard accent={netProfitCents >= 0 ? "green" : "red"} label="P/L" value={formatCurrency(netProfitCents)} />
          <StatCard accent="dark" label="Bills" value={orderSummary.totalBills} />
        </section>

        <div className="report-tabs grid gap-3">
          <section className="report-tab-panel grid gap-3" id="total-sales">
            <AdminCard title="Sales history" eyebrow={`${daily.length} days`}>
              <TableShell>
                <table className="premium-table min-w-[760px] text-left">
                  <thead>
                    <tr>
                      <th>Date</th><th>Bills</th><th className="currency-cell">Sales</th><th className="currency-cell">Commission</th><th className="currency-cell">Tips</th><th className="currency-cell">Expenses</th><th className="currency-cell">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.map((row) => (
                      <tr key={row.date}>
                        <td className="font-bold">{row.date}</td><td>{row.bills}</td><td className="currency-cell">{formatCurrency(row.sales)}</td><td className="currency-cell">{formatCurrency(row.commission)}</td><td className="currency-cell">{formatCurrency(row.tips)}</td><td className="currency-cell">{formatCurrency(row.expenses)}</td><td className="currency-cell font-black">{formatCurrency(row.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </AdminCard>
            <div className="grid gap-3 lg:grid-cols-2">
              <AdminCard title="Payment modes">
                <Breakdown rows={[...paymentBreakdown.entries()]} />
              </AdminCard>
              <AdminCard title="Top waitress by sales">
                <Ranking rows={topBySales} valueKey="sales" />
              </AdminCard>
            </div>
          </section>

          <section className="report-tab-panel grid gap-3" id="total-commissions">
            <div className="grid gap-3 lg:grid-cols-2">
              <AdminCard title="Top waitress by commission">
                <Ranking rows={topByCommission} valueKey="commission" />
              </AdminCard>
              <AdminCard title="Tips" eyebrow={`${tips.length} tips`}>
                <ListRows rows={tips.map((tip) => [tip.staff.name, `${tip.order.billNumber} · ${formatCurrency(tip.amountCents)} · ${tip.paymentMode}`])} />
              </AdminCard>
            </div>
            <AdminCard title="Waitress commission cards" eyebrow="Click name for tables, tips, advances and payouts">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {staffRows.sort((a, b) => b.commission - a.commission).map((row) => (
                  <Link className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md" href={`/reports/staff/${row.id}?startDate=${range.startDate}&endDate=${range.endDate}`} key={row.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black">{row.name}</p>
                        <p className="mt-1 text-xs font-bold text-stone-500">Normal {row.normalPercent}% · Special {row.specialPercent}%</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[var(--color-gold-dark)]" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <MiniMetric label="Sales" value={formatCurrency(row.sales)} />
                      <MiniMetric label="Commission" value={formatCurrency(row.commission)} />
                      <MiniMetric label="Tips" value={formatCurrency(row.tips)} />
                      <MiniMetric label="Advances" value={formatCurrency(row.advances)} />
                      <MiniMetric label="Payouts" value={formatCurrency(row.payouts)} />
                      <MiniMetric label="Bills" value={row.bills.toString()} />
                    </div>
                  </Link>
                ))}
              </div>
            </AdminCard>
            <AdminCard title="Total commissions" eyebrow={`${staffRows.length} staff`}>
              <TableShell>
                <table className="premium-table min-w-[760px] text-left">
                  <thead><tr><th>Waitress</th><th>%</th><th>Bills</th><th className="currency-cell">Sales</th><th className="currency-cell">Commission</th><th className="currency-cell">Tips</th><th className="currency-cell">Advances</th><th className="currency-cell">Payouts</th></tr></thead>
                  <tbody>
                    {staffRows.sort((a, b) => b.commission - a.commission).map((row) => (
                      <tr key={row.id}><td className="font-bold"><Link className="hover:text-[var(--color-gold-dark)]" href={`/reports/staff/${row.id}?startDate=${range.startDate}&endDate=${range.endDate}`}>{row.name}</Link></td><td>{row.normalPercent}% / {row.specialPercent}%</td><td>{row.bills}</td><td className="currency-cell">{formatCurrency(row.sales)}</td><td className="currency-cell font-black">{formatCurrency(row.commission)}</td><td className="currency-cell">{formatCurrency(row.tips)}</td><td className="currency-cell">{formatCurrency(row.advances)}</td><td className="currency-cell">{formatCurrency(row.payouts)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </AdminCard>
          </section>

          <section className="report-tab-panel grid gap-3" id="total-expenses">
            <AdminCard title="Total expenses" eyebrow={`${expenses.length} rows`}>
              <Breakdown rows={[...expenseBreakdown.entries()]} />
            </AdminCard>
            <AdminCard title="Expense rows" eyebrow={`${expenses.length} expenses`}>
              <ListRows rows={expenses.slice(0, 80).map((expense) => [expense.category.name, `${formatCurrency(expense.amountCents)} · ${expense.paymentMode} · ${expense.paidTo}`])} />
            </AdminCard>
          </section>

          <section className="report-tab-panel grid gap-3" id="profit-loss">
            <AdminCard title="Profit / Loss summary">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span>Total sales</span><b>{formatCurrency(orderSummary.netSalesCents)}</b></div>
                <div className="flex justify-between"><span>Inventory cost</span><b>{formatCurrency(orderSummary.inventoryCostCents)}</b></div>
                <div className="flex justify-between"><span>Total commission</span><b>{formatCurrency(totalCommissionCents)}</b></div>
                <div className="flex justify-between"><span>Total tips</span><b>{formatCurrency(orderSummary.tipsCents)}</b></div>
                <div className="flex justify-between"><span>Total expenses</span><b>{formatCurrency(expenseCents)}</b></div>
                <div className="flex justify-between border-t pt-2 text-base"><span>P/L after commission + expenses</span><b>{formatCurrency(netProfitCents)}</b></div>
              </div>
            </AdminCard>
            <div className="grid gap-3 lg:grid-cols-2">
              <AdminCard title="Inventory cost" eyebrow={`${inventoryTransactions.length} transactions`}>
                <ListRows rows={inventoryTransactions.slice(0, 80).map((transaction) => [transaction.item.name, `Qty ${Math.abs(transaction.quantityChange)} · Cost ${formatCurrency(transaction.totalCostCents)} · ${transaction.type}`])} />
              </AdminCard>
              <AdminCard title="Complimentary report" eyebrow={`${complimentaryItems.length} items`}>
                <ListRows rows={complimentaryItems.slice(0, 80).map((line) => [line.item.name, `${line.order.staff.name} · ${line.order.billNumber} · ${line.complimentaryReason ?? line.offer?.name ?? "Offer"}`])} />
              </AdminCard>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Ranking({ rows, valueKey }: { rows: { name: string; sales: number; commission: number }[]; valueKey: "sales" | "commission" }) {
  return <div className="grid gap-2">{rows.map((row, index) => <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-stone-50 p-2.5 text-sm" key={row.name}><span><b>#{index + 1} {row.name}</b></span><b className="text-[var(--color-gold-dark)]">{formatCurrency(row[valueKey])}</b></div>)}</div>;
}

function Breakdown({ rows }: { rows: [string, number][] }) {
  return <div className="grid gap-2 sm:grid-cols-2">{rows.map(([label, amount]) => <div className="rounded-xl border border-[var(--color-border)] bg-stone-50 p-2.5" key={label}><p className="text-xs font-semibold text-stone-500">{label}</p><p className="text-base font-black">{formatCurrency(amount)}</p></div>)}</div>;
}

function ListRows({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-stone-500">No rows in this date range.</p>;
  return <div className="grid max-h-[360px] gap-2 overflow-y-auto">{rows.map(([title, body], index) => <div className="rounded-xl border border-[var(--color-border)] bg-stone-50 p-2.5 text-sm" key={`${title}-${index}`}><b>{title}</b><span className="text-stone-600"> · {body}</span></div>)}</div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-stone-50 p-2"><p className="text-[11px] font-black uppercase tracking-wide text-stone-500">{label}</p><p className="mt-0.5 font-black text-stone-950">{value}</p></div>;
}

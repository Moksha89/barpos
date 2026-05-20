import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
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

  const [orders, expenses, tips, inventoryTransactions, complimentaryItems, ledgerCommissions] = await Promise.all([
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
  const staffRows = [...staffTotals.entries()].map(([name, totals]) => ({ name, ...totals }));
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
    <div className="p-2.5 text-stone-950 sm:p-4">
      <div className="mx-auto grid max-w-7xl gap-3">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Reports</p>
            <h1 className="mt-1 text-lg font-black sm:text-2xl">Sales, commission and P/L</h1>
            <p className="mt-1 text-sm text-stone-600">Filter any date range for sales, tips, expenses, daily P/L and top waitresses.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {[
            ["Total Sales", formatCurrency(orderSummary.netSalesCents)],
            ["Total Commission", formatCurrency(totalCommissionCents)],
            ["Total Tips", formatCurrency(orderSummary.tipsCents)],
            ["Expenses", formatCurrency(expenseCents)],
            ["P/L", formatCurrency(netProfitCents)],
            ["Bills", String(orderSummary.totalBills)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">{label}</p>
              <p className="mt-1 text-lg font-black sm:text-xl">{value}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-3 xl:grid-cols-2">
          <AdminCard title="Daily report" eyebrow={`${daily.length} days`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-stone-500">
                  <tr>
                    <th className="px-2 py-2">Date</th><th className="px-2 py-2">Bills</th><th className="px-2 py-2">Sales</th><th className="px-2 py-2">Commission</th><th className="px-2 py-2">Tips</th><th className="px-2 py-2">Expenses</th><th className="px-2 py-2">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {daily.map((row) => (
                    <tr key={row.date}>
                      <td className="px-2 py-2 font-bold">{row.date}</td><td className="px-2 py-2">{row.bills}</td><td className="px-2 py-2">{formatCurrency(row.sales)}</td><td className="px-2 py-2">{formatCurrency(row.commission)}</td><td className="px-2 py-2">{formatCurrency(row.tips)}</td><td className="px-2 py-2">{formatCurrency(row.expenses)}</td><td className="px-2 py-2 font-black">{formatCurrency(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>

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
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <AdminCard title="Top waitress by commission">
            <Ranking rows={topByCommission} valueKey="commission" />
          </AdminCard>
          <AdminCard title="Top waitress by sales">
            <Ranking rows={topBySales} valueKey="sales" />
          </AdminCard>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <AdminCard title="Payment modes">
            <Breakdown rows={[...paymentBreakdown.entries()]} />
          </AdminCard>
          <AdminCard title="Expenses by category">
            <Breakdown rows={[...expenseBreakdown.entries()]} />
          </AdminCard>
        </div>

        <AdminCard title="Waitress commission detail" eyebrow={`${staffRows.length} staff`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500"><tr><th className="px-2 py-2">Waitress</th><th className="px-2 py-2">Bills</th><th className="px-2 py-2">Sales</th><th className="px-2 py-2">Commission</th><th className="px-2 py-2">Tips</th></tr></thead>
              <tbody className="divide-y divide-stone-100">
                {staffRows.sort((a, b) => b.commission - a.commission).map((row) => (
                  <tr key={row.name}><td className="px-2 py-2 font-bold">{row.name}</td><td className="px-2 py-2">{row.bills}</td><td className="px-2 py-2">{formatCurrency(row.sales)}</td><td className="px-2 py-2">{formatCurrency(row.commission)}</td><td className="px-2 py-2">{formatCurrency(row.tips)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <div className="grid gap-3 lg:grid-cols-2">
          <AdminCard title="Tips" eyebrow={`${tips.length} tips`}>
            <ListRows rows={tips.map((tip) => [tip.staff.name, `${tip.order.billNumber} · ${formatCurrency(tip.amountCents)} · ${tip.paymentMode}`])} />
          </AdminCard>
          <AdminCard title="Expense rows" eyebrow={`${expenses.length} expenses`}>
            <ListRows rows={expenses.slice(0, 80).map((expense) => [expense.category.name, `${formatCurrency(expense.amountCents)} · ${expense.paymentMode} · ${expense.paidTo}`])} />
          </AdminCard>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <AdminCard title="Inventory cost" eyebrow={`${inventoryTransactions.length} transactions`}>
            <ListRows rows={inventoryTransactions.slice(0, 80).map((transaction) => [transaction.item.name, `Qty ${Math.abs(transaction.quantityChange)} · Cost ${formatCurrency(transaction.totalCostCents)} · ${transaction.type}`])} />
          </AdminCard>
          <AdminCard title="Complimentary report" eyebrow={`${complimentaryItems.length} items`}>
            <ListRows rows={complimentaryItems.slice(0, 80).map((line) => [line.item.name, `${line.order.staff.name} · ${line.order.billNumber} · ${line.complimentaryReason ?? line.offer?.name ?? "Offer"}`])} />
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function Ranking({ rows, valueKey }: { rows: { name: string; sales: number; commission: number }[]; valueKey: "sales" | "commission" }) {
  return <div className="grid gap-2">{rows.map((row, index) => <div className="flex items-center justify-between rounded-xl bg-stone-50 p-2.5 text-sm" key={row.name}><span><b>#{index + 1} {row.name}</b></span><b className="text-amber-700">{formatCurrency(row[valueKey])}</b></div>)}</div>;
}

function Breakdown({ rows }: { rows: [string, number][] }) {
  return <div className="grid gap-2 sm:grid-cols-2">{rows.map(([label, amount]) => <div className="rounded-xl bg-stone-50 p-2.5" key={label}><p className="text-xs font-semibold text-stone-500">{label}</p><p className="text-base font-black">{formatCurrency(amount)}</p></div>)}</div>;
}

function ListRows({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-stone-500">No rows in this date range.</p>;
  return <div className="grid max-h-[360px] gap-2 overflow-y-auto">{rows.map(([title, body], index) => <div className="rounded-xl border border-stone-200 p-2.5 text-sm" key={`${title}-${index}`}><b>{title}</b><span className="text-stone-600"> · {body}</span></div>)}</div>;
}
